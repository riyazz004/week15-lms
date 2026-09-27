"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
};

export default function StudentCoursesPage() {
  const router = useRouter();
  const supabase = createClient();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourses() {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, thumbnail_url")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading courses:", error);
      } else {
        setCourses(data || []);
      }

      setLoading(false);
    }

    loadCourses();
  }, [supabase]);

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("Please log in first.");
      setEnrolling(null);
      return;
    }

    // Check whether the student is already enrolled
    const { data: existingEnrollment, error: checkError } =
      await supabase
        .from("enrollments")
        .select("id")
        .eq("student_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

    if (checkError) {
      console.error("Enrollment check error:", checkError);
      alert(checkError.message);
      setEnrolling(null);
      return;
    }

    if (existingEnrollment) {
      alert("You are already enrolled in this course.");
      setEnrolling(null);
      return;
    }

    // Create enrollment
    const { error } = await supabase.from("enrollments").insert({
      student_id: user.id,
      course_id: courseId,
    });

    if (error) {
      console.error("Enrollment error:", error);
      alert(error.message);
      setEnrolling(null);
      return;
    }

    // Enrollment successful
    alert("Successfully enrolled!");

    // Automatically open the course learning page
    window.location.href = `/dashboard/student/courses/${courseId}`;
  };

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.push("/dashboard/student")}
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          ← Back to Student Dashboard
        </button>

        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            Student Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Available Courses
          </h1>

          <p className="mt-2 text-gray-600">
            Browse published courses and start learning.
          </p>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading courses...</p>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <p className="text-gray-600">
              No published courses are available yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200"
              >
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-44 items-center justify-center bg-gray-100 text-5xl">
                    📚
                  </div>
                )}

                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {course.title}
                  </h2>

                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                    {course.description || "No description available."}
                  </p>

                  <button
                    onClick={() => handleEnroll(course.id)}
                    disabled={enrolling === course.id}
                    className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {enrolling === course.id
                      ? "Enrolling..."
                      : "Enroll"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}