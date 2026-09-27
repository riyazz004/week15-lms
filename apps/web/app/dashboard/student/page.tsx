"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
};
type Lesson = {
  id: string;
  course_id: string;
};
type LessonProgress = {
  lesson_id: string;
  completed: boolean;
};
type CourseProgress = {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
};
export default function StudentDashboard() {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<
    Record<string, CourseProgress>
  >({});
  const [overallProgress, setOverallProgress] =
    useState<CourseProgress>({
      totalLessons: 0,
      completedLessons: 0,
      percentage: 0,
    });
  const [loading, setLoading] = useState(true);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  useEffect(() => {
    async function loadMyCourses() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      // Get student's enrolled courses
      const { data: enrollments, error: enrollmentError } =
        await supabase
          .from("enrollments")
          .select("course_id")
          .eq("student_id", user.id);
      if (enrollmentError) {
        console.error(
          "Error loading enrollments:",
          enrollmentError
        );
        setLoading(false);
        return;
      }
      if (!enrollments || enrollments.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }
      const courseIds = enrollments.map(
        (enrollment) => enrollment.course_id
      );
      // Get enrolled courses
      const { data: enrolledCourses, error: courseError } =
        await supabase
          .from("courses")
          .select(
            "id, title, description, thumbnail_url"
          )
          .in("id", courseIds);
      if (courseError) {
        console.error(
          "Error loading courses:",
          courseError
        );
        setLoading(false);
        return;
      }
      const loadedCourses = enrolledCourses || [];
      setCourses(loadedCourses);
      // Get lessons for enrolled courses
      const { data: lessonsData, error: lessonsError } =
        await supabase
          .from("lessons")
          .select("id, course_id")
          .in("course_id", courseIds);
      if (lessonsError) {
        console.error(
          "Error loading lessons:",
          lessonsError
        );
        setLoading(false);
        return;
      }
      const lessons = (lessonsData || []) as Lesson[];
      // Get student's completed lesson progress
      const { data: progressData, error: progressError } =
        await supabase
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("student_id", user.id)
          .eq("completed", true);
      if (progressError) {
        console.error(
          "Error loading lesson progress:",
          progressError
        );
        setLoading(false);
        return;
      }
      const completedProgress =
        (progressData || []) as LessonProgress[];
      const completedLessonIds = new Set(
        completedProgress.map(
          (item) => item.lesson_id
        )
      );
      // Calculate progress for every course
      const progressMap: Record<
        string,
        CourseProgress
      > = {};
      let totalLessons = 0;
      let totalCompletedLessons = 0;
      loadedCourses.forEach((course) => {
        const courseLessons = lessons.filter(
          (lesson) =>
            lesson.course_id === course.id
        );
        const completedLessons =
          courseLessons.filter((lesson) =>
            completedLessonIds.has(lesson.id)
          ).length;
        const courseTotalLessons =
          courseLessons.length;
        const percentage =
          courseTotalLessons > 0
            ? Math.round(
                (completedLessons /
                  courseTotalLessons) *
                  100
              )
            : 0;
        progressMap[course.id] = {
          totalLessons: courseTotalLessons,
          completedLessons,
          percentage,
        };
        totalLessons += courseTotalLessons;
        totalCompletedLessons += completedLessons;
      });
      const overallPercentage =
        totalLessons > 0
          ? Math.round(
              (totalCompletedLessons /
                totalLessons) *
                100
            )
          : 0;
      setCourseProgress(progressMap);
      setOverallProgress({
        totalLessons,
        completedLessons: totalCompletedLessons,
        percentage: overallPercentage,
      });
      setLoading(false);
    }
    loadMyCourses();
  }, []);
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-600">
              Student Portal
            </p>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-red-500 hover:text-white"
            >
              Logout
            </button>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Student Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Continue learning and track your course progress.
          </p>
        </div>
        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* My Courses */}
          <a
            href="/dashboard/student/courses"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-3xl">📚</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              My Courses
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {loading
                ? "Loading your courses..."
                : `${courses.length} course${
                    courses.length === 1 ? "" : "s"
                  } enrolled`}
            </p>
            <p className="mt-4 text-sm font-medium text-blue-600">
              Browse courses →
            </p>
          </a>
         
          {/* Learning Goals */}
          <a
            href="#learning-goals"
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="text-3xl">🎯</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Learning Goals
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Stay focused on your learning goals.
            </p>
            <p className="mt-4 text-sm font-medium text-blue-600">
              View goals →
            </p>
          </a>
        </div>
        {/* Learning Progress */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              📊 Your Learning Progress
            </h2>
            <p className="mt-1 text-gray-600">
              Track your progress across all enrolled courses.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Courses Enrolled */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📚</div>
                <div>
                  <p className="text-sm text-gray-500">
                    Courses Enrolled
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {loading ? "—" : courses.length}
                  </p>
                </div>
              </div>
            </div>
            {/* Lessons Completed */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-center gap-3">
                <div className="text-3xl">✅</div>
                <div>
                  <p className="text-sm text-gray-500">
                    Lessons Completed
                  </p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {loading
                      ? "—"
                      : `${overallProgress.completedLessons}/${overallProgress.totalLessons}`}
                  </p>
                </div>
              </div>
            </div>
            {/* Overall Progress */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📈</div>
                <div>
                  <p className="text-sm text-gray-500">
                    Overall Progress
                  </p>
                  <p className="mt-1 text-2xl font-bold text-blue-600">
                    {loading
                      ? "—"
                      : `${overallProgress.percentage}%`}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Overall Progress Bar */}
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Overall Learning Progress
              </h3>
              <span className="text-sm font-semibold text-blue-600">
                {loading
                  ? "—"
                  : `${overallProgress.percentage}%`}
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-500"
                style={{
                  width: `${overallProgress.percentage}%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {loading
                ? "Loading progress..."
                : `${overallProgress.completedLessons} of ${overallProgress.totalLessons} lessons completed`}
            </p>
          </div>
        </section>
        {/* My Courses */}
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              My Courses
            </h2>
            <p className="mt-1 text-gray-600">
              Courses you are currently enrolled in.
            </p>
          </div>
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
              <p className="text-gray-600">
                Loading your courses...
              </p>
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
              <div className="text-5xl">📚</div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No courses yet
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                You haven't enrolled in any courses yet.
              </p>
              <a
                href="/dashboard/student/courses"
                className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
              >
                Browse Courses
              </a>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => {
                const progress = courseProgress[course.id] || {
                  totalLessons: 0,
                  completedLessons: 0,
                  percentage: 0,
                };
                const courseCompleted =
                  progress.totalLessons > 0 &&
                  progress.completedLessons ===
                    progress.totalLessons;
                return (
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
                      <h3 className="text-xl font-semibold text-gray-900">
                        {course.title}
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                        {course.description ||
                          "No description available."}
                      </p>
                      {/* Course Progress */}
                      <div className="mt-5">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Progress
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              courseCompleted
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          >
                            {progress.percentage}%
                          </span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              courseCompleted
                                ? "bg-green-500"
                                : "bg-blue-600"
                            }`}
                            style={{
                              width: `${progress.percentage}%`,
                            }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          {progress.completedLessons} of{" "}
                          {progress.totalLessons} lessons completed
                        </p>
                      </div>
                      {/* Completion Status */}
                      {courseCompleted && (
                        <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                          🎉 Course Completed!
                        </div>
                      )}
                      <a
                        href={`/dashboard/student/courses/${course.id}`}
                        className="mt-5 block w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-medium text-white transition hover:bg-blue-700"
                      >
                        {courseCompleted
                          ? "Review Course"
                          : "Continue Learning"}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {/* Learning Goals */}
        <section
          id="learning-goals"
          className="mt-10 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200"
        >
          <h2 className="text-2xl font-bold text-gray-900">
            🎯 Learning Goals
          </h2>
          <p className="mt-2 text-gray-600">
            Keep building your skills and complete your enrolled courses.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-5">
              <p className="font-semibold text-gray-900">
                Complete Courses
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Finish your enrolled lessons.
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-5">
              <p className="font-semibold text-gray-900">
                Track Progress
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Mark lessons as completed.
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-5">
              <p className="font-semibold text-gray-900">
                Keep Learning
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Continue improving your skills.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}