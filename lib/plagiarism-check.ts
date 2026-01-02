"use server";

import { db } from "@/lib/db";

interface PlagiarismCheckResult {
  similarityScore: number;
  matches: Array<{
    submissionId: string;
    studentName: string;
    similarity: number;
    matchedContent: string;
  }>;
  externalMatches: Array<{
    source: string;
    url: string;
    similarity: number;
  }>;
}

/**
 * Check for plagiarism in a submission
 * This is a simplified implementation. In production, integrate with:
 * - Turnitin API
 * - Copyscape API
 * - Unicheck API
 * - Custom similarity algorithms (Levenshtein distance, cosine similarity)
 */
export async function checkPlagiarism(
  submissionId: string,
  content: string
): Promise<PlagiarismCheckResult> {
  try {
    // Get the submission and assignment
    const submission = await db.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: true,
      },
    });

    if (!submission) {
      throw new Error("Submission not found");
    }

    // Get all other submissions for the same assignment
    const otherSubmissions = await db.assignmentSubmission.findMany({
      where: {
        assignmentId: submission.assignmentId,
        id: { not: submissionId },
        textContent: { not: null },
      },
      include: {
        student: {
          select: {
            name: true,
          },
        },
      },
    });

    // Simple similarity check (in production, use better algorithms)
    const matches = otherSubmissions
      .map((other) => {
        const similarity = calculateSimilarity(content, other.textContent || "");
        return {
          submissionId: other.id,
          studentName: other.student.name || "Unknown",
          similarity: Math.round(similarity * 100),
          matchedContent: extractMatchedContent(content, other.textContent || ""),
        };
      })
      .filter((match) => match.similarity > 20) // Only include significant matches
      .sort((a, b) => b.similarity - a.similarity);

    // Mock external matches (in production, call external APIs)
    const externalMatches: Array<{
      source: string;
      url: string;
      similarity: number;
    }> = [];

    // Calculate overall similarity score
    const maxSimilarity = matches.length > 0 ? matches[0].similarity : 0;

    const result: PlagiarismCheckResult = {
      similarityScore: maxSimilarity,
      matches,
      externalMatches,
    };

    // Save plagiarism check results
    await db.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        plagiarismScore: maxSimilarity,
        plagiarismReport: JSON.stringify(result),
        plagiarismCheckedAt: new Date(),
      },
    });

    return result;
  } catch (error) {
    console.error("[CHECK_PLAGIARISM]", error);
    throw error;
  }
}

/**
 * Calculate similarity between two texts using Jaccard similarity
 * In production, use better algorithms like:
 * - Cosine similarity with TF-IDF
 * - Levenshtein distance
 * - Smith-Waterman algorithm
 */
function calculateSimilarity(text1: string, text2: string): number {
  // Normalize and tokenize
  const tokens1 = new Set(
    text1
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((t) => t.length > 3)
  );

  const tokens2 = new Set(
    text2
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter((t) => t.length > 3)
  );

  // Calculate Jaccard similarity
  const intersection = new Set(Array.from(tokens1).filter((t) => tokens2.has(t)));
  const union = new Set([...Array.from(tokens1), ...Array.from(tokens2)]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Extract a snippet of matched content
 */
function extractMatchedContent(text1: string, text2: string): string {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  // Find longest common substring
  let maxLength = 0;
  let endIndex = 0;

  for (let i = 0; i < words1.length; i++) {
    for (let j = 0; j < words2.length; j++) {
      let length = 0;
      while (
        i + length < words1.length &&
        j + length < words2.length &&
        words1[i + length] === words2[j + length]
      ) {
        length++;
      }
      if (length > maxLength) {
        maxLength = length;
        endIndex = i + length;
      }
    }
  }

  if (maxLength < 5) return ""; // No significant match

  const start = Math.max(0, endIndex - maxLength);
  const matchedWords = words1.slice(start, endIndex);
  return matchedWords.join(" ");
}

/**
 * Integration helper for external plagiarism APIs
 * Uncomment and configure when using real services
 */
/*
async function checkExternalPlagiarism(text: string) {
  // Example: Turnitin API integration
  // const response = await fetch('https://api.turnitin.com/v1/check', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.TURNITIN_API_KEY}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ text }),
  // });
  // return await response.json();
}
*/
