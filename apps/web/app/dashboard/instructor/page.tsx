"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
type Course = {
  id: string;
  title: string;
};
type Enrollment = {
  id: string;
  student_id: string;
  course_id: string;
};
type Lesson = {
  id: string;
  course_id: string;
};
type LessonProgress = {
  student_id: string;
  lesson_id: string;
  completed: boolean;
};
type StudentProfile = {
  id: string;
  full_name: string | null;
};
type StudentMonitoring = {
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  completedLessons: number;
  totalLessons: number;
  progress: number;
};
export default function InstructorDashboard() {
  const supabase = createClient();
  const [monitoring, setMonitoring] = useState<StudentMonitoring[]>([]);
  const [loadingMonitoring, setLoadingMonitoring] = useState(true);
  const [monitoringError, setMonitoringError] = useState("");
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };
  useEffect(() => {
    loadStudentMonitoring();
  }, []);
  const loadStudentMonitoring = async () => {
    setLoadingMonitoring(true);
    setMonitoringError("");
    try {
      // Get logged-in instructor
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Instructor not logged in.");
      }
      // Get courses created by this instructor
      const { data: coursesData, error: coursesError } =
        await supabase
          .from("courses")
          .select("id, title")
          .eq("instructor_id", user.id);
      if (coursesError) {
        throw new Error(coursesError.message);
      }
      const courses = (coursesData || []) as Course[];
      if (courses.length === 0) {
        setMonitoring([]);
        setLoadingMonitoring(false);
        return;
      }
      const courseIds = courses.map((course) => course.id);
      // Get enrollments for instructor's courses
      const { data: enrollmentsData, error: enrollmentsError } =
        await supabase
          .from("enrollments")
          .select("id, student_id, course_id")
          .in("course_id", courseIds);
      if (enrollmentsError) {
        throw new Error(enrollmentsError.message);
      }
      const enrollments = (enrollmentsData || []) as Enrollment[];
      if (enrollments.length === 0) {
        setMonitoring([]);
        setLoadingMonitoring(false);
        return;
      }
      // Get all lessons from instructor's courses
      const { data: lessonsData, error: lessonsError } =
        await supabase
          .from("lessons")
          .select("id, course_id")
          .in("course_id", courseIds);
      if (lessonsError) {
        throw new Error(lessonsError.message);
      }
      const lessons = (lessonsData || []) as Lesson[];
      // Get student IDs
      const studentIds = [
        ...new Set(
          enrollments.map((enrollment) => enrollment.student_id)
        ),
      ];
      // Get lesson IDs
      const lessonIds = lessons.map((lesson) => lesson.id);
      // Get completed lesson progress
      let progressData: LessonProgress[] = [];
      if (studentIds.length > 0 && lessonIds.length > 0) {
        const { data, error: progressError } = await supabase
          .from("lesson_progress")
          .select("student_id, lesson_id, completed")
          .in("student_id", studentIds)
          .in("lesson_id", lessonIds);
        if (progressError) {
          console.error(
            "STUDENT MONITORING PROGRESS ERROR:",
            progressError.message
          );
          throw new Error(progressError.message);
        }
        progressData = (data || []) as LessonProgress[];
      }
      // Get student profiles
      // NOTE: email is NOT stored in public.profiles
      const { data: profilesData, error: profilesError } =
        await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", studentIds);
      if (profilesError) {
        throw new Error(profilesError.message);
      }
      const profiles = (profilesData || []) as StudentProfile[];
      // Build monitoring data
      const monitoringData: StudentMonitoring[] = enrollments.map(
        (enrollment) => {
          const course = courses.find(
            (item) => item.id === enrollment.course_id
          );
          const courseLessons = lessons.filter(
            (lesson) => lesson.course_id === enrollment.course_id
          );
          const completedLessons = courseLessons.filter((lesson) =>
            progressData.some(
              (progress) =>
                progress.student_id === enrollment.student_id &&
                progress.lesson_id === lesson.id &&
                progress.completed === true
            )
          ).length;
          const totalLessons = courseLessons.length;
          const progress =
            totalLessons > 0
              ? Math.round(
                  (completedLessons / totalLessons) * 100
                )
              : 0;
          const profile = profiles.find(
            (item) => item.id === enrollment.student_id
          );
          return {
            studentId: enrollment.student_id,
            studentName: profile?.full_name || "Student",
            courseId: enrollment.course_id,
            courseTitle: course?.title || "Unknown Course",
            completedLessons,
            totalLessons,
            progress,
          };
        }
      );
      setMonitoring(monitoringData);
    } catch (error) {
      console.error("STUDENT MONITORING ERROR:", error);
      setMonitoringError(
        error instanceof Error
          ? error.message
          : "Unable to load student monitoring."
      );
    } finally {
      setLoadingMonitoring(false);
    }
  };
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-purple-600">
              Instructor Portal
            </p>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Logout
            </button>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">
            Instructor Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Create courses, manage lessons, and monitor students.
          </p>
        </div>
        {/* Dashboard Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* My Courses */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="text-3xl">📚</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              My Courses
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Create and manage your courses.
            </p>
            <div className="mt-5 flex gap-3">
              <a
                href="/dashboard/instructor/courses"
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Add Course
              </a>
            </div>
          </div>
          {/* Students */}
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <div className="text-3xl">👥</div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Students
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              View enrolled students and their progress.
            </p>
            <div className="mt-5 rounded-xl bg-gray-100 px-4 py-2 text-center text-sm font-medium text-gray-700">
              {loadingMonitoring
                ? "Loading..."
                : `${monitoring.length} Enrollment${
                    monitoring.length === 1 ? "" : "s"
                  }`}
            </div>
          </div>
        </div>
        {/* Student Monitoring */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                👥 Student Monitoring
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Monitor enrolled students and their course progress.
              </p>
            </div>
            <button
              onClick={loadStudentMonitoring}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
          {/* Loading */}
          {loadingMonitoring && (
            <div className="mt-6 rounded-xl bg-gray-50 p-6 text-center text-gray-500">
              Loading student progress...
            </div>
          )}
          {/* Error */}
          {!loadingMonitoring && monitoringError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
              <p className="font-semibold text-red-700">
                Unable to load student monitoring
              </p>
              <p className="mt-2 text-sm text-red-600">
                {monitoringError}
              </p>
              <p className="mt-3 text-xs text-red-500">
                Check your Supabase RLS policies if the error mentions
                permissions or rows not being visible.
              </p>
            </div>
          )}
          {/* No Students */}
          {!loadingMonitoring &&
            !monitoringError &&
            monitoring.length === 0 && (
              <div className="mt-6 rounded-xl bg-gray-50 p-8 text-center">
                <div className="text-4xl">👨‍🎓</div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  No enrolled students yet
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Students who enroll in your courses will appear here.
                </p>
              </div>
            )}
          {/* Student Table */}
          {!loadingMonitoring &&
            !monitoringError &&
            monitoring.length > 0 && (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[800px] border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-left">
                      <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                        Student
                      </th>
                      <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                        Course
                      </th>
                      <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                        Progress
                      </th>
                      <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                        Lessons
                      </th>
                      <th className="px-4 py-4 text-sm font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitoring.map((student, index) => (
                      <tr
                        key={`${student.studentId}-${student.courseId}-${index}`}
                        className="border-b border-gray-100 last:border-0"
                      >
                        {/* Student */}
                        <td className="px-4 py-5">
                          <p className="font-semibold text-gray-900">
                            {student.studentName}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            Student ID: {student.studentId}
                          </p>
                        </td>
                        {/* Course */}
                        <td className="px-4 py-5">
                          <p className="font-medium text-gray-800">
                            {student.courseTitle}
                          </p>
                        </td>
                        {/* Progress */}
                        <td className="px-4 py-5">
                          <div className="w-40">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-gray-500">
                                Progress
                              </span>
                              <span className="font-semibold text-gray-700">
                                {student.progress}%
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className="h-full rounded-full bg-purple-600 transition-all"
                                style={{
                                  width: `${student.progress}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        {/* Lessons */}
                        <td className="px-4 py-5 text-sm text-gray-700">
                          {student.completedLessons} /{" "}
                          {student.totalLessons}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-5">
                          {student.progress === 100 ? (
                            <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              Completed
                            </span>
                          ) : student.progress > 0 ? (
                            <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                              In Progress
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                              Not Started
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </section>
      </div>
    </main>
  );
}