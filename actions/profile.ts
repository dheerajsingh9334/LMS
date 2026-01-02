import { db } from "@/lib/db";

export const updateUserProfile = async (userId: string, data: any) => {
  try {
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        ...data,
        ...(data.dateOfBirth && { dateOfBirth: new Date(data.dateOfBirth) }),
      },
    });

    return { success: "Profile updated successfully!", user: updatedUser };
  } catch (error) {
    console.error("[UPDATE_PROFILE]", error);
    return { error: "Failed to update profile" };
  }
};

export const getTeacherProfile = async (teacherId: string) => {
  try {
    const teacher = await db.user.findUnique({
      where: { id: teacherId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        headline: true,
        bio: true,
        achievements: true,
        socialLinks: true,
      },
    });

    return teacher;
  } catch (error) {
    console.error("[GET_TEACHER_PROFILE]", error);
    return null;
  }
};
