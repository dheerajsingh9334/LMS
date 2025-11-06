"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: string[]; // JSON string array
}

export const FAQSection = ({ faqs }: FAQSectionProps) => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  if (!faqs || faqs.length === 0) return null;

  // Parse FAQ strings (assuming they're stored as JSON)
  let parsedFAQs: FAQ[] = [];
  try {
    parsedFAQs = faqs.map((faq) => {
      if (typeof faq === "string") {
        try {
          return JSON.parse(faq);
        } catch {
          // If not JSON, treat as question
          return { question: faq, answer: "" };
        }
      }
      return faq;
    });
  } catch (error) {
    console.error("Error parsing FAQs:", error);
    return null;
  }

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          Frequently Asked Questions
        </CardTitle>
        <CardDescription>
          Common questions about this course
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {parsedFAQs.map((faq, index) => (
            <div
              key={index}
              className="border border-slate-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
              >
                <span className="font-semibold text-slate-900">
                  {faq.question}
                </span>
                {openItems.includes(index) ? (
                  <ChevronUp className="h-5 w-5 text-slate-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-600 flex-shrink-0" />
                )}
              </button>
              {openItems.includes(index) && faq.answer && (
                <div className="px-4 pb-4 text-slate-700 bg-slate-50">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
