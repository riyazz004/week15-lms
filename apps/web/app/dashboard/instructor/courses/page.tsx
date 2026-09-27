import Link from "next/link";
import DeleteCourseButton from "./DeleteCourseButton";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
export default async function InstructorCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "instructor") {
    redirect("/dashboard");
  }
  const { data: courses, error } = await supabase
    .from("courses")
    .select("*")
    .eq("instructor_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching courses:", error);
  }
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {/* Back to Dashboard */}
            <Link
              href="/dashboard"
              className="mb-5 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              ← Back to Dashboard
            </Link>
            <p className="text-sm font-medium text-purple-600">
              Instructor Portal
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              My Courses
            </h1>
            <p className="mt-2 text-gray-600">
              Manage the courses you have created.
            </p>
          </div>
          <Link
            href="/dashboard/instructor/courses/create"
            className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
          >
            + Create Course
          </Link>
        </div>
        <div className="mt-8">
          {!courses || courses.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-gray-200">
              <div className="text-5xl">📚</div>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                No courses yet
              </h2>
              <p className="mt-2 text-gray-600">
                Create your first course to start teaching.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200"
                >
                  <div className="flex h-40 items-center justify-center bg-gray-100 text-5xl">
                    📚
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {course.title}
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                      {course.description || "No description available."}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          course.published
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {course.published ? "Published" : "Draft"}
                      </span>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/instructor/courses/${course.id}/edit`}
                          className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                        >
                          Edit
                        </Link>
                        <DeleteCourseButton courseId={course.id} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}