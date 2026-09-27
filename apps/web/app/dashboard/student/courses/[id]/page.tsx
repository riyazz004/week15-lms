"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
type Course = {
  id: string;
  title: string;
  description: string | null;
};
type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  position: number;
  created_at: string;
};
type Progress = {
  lesson_id: string;
  completed: boolean;
};
export default function StudentCoursePage() {
  const params = useParams();
  const courseId = params.id as string;
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  useEffect(() => {
    async function loadCourse() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      // Check if the student is enrolled
      const { data: enrollment, error: enrollmentError } =
        await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();
      if (enrollmentError) {
        console.error("Enrollment error:", enrollmentError);
        setLoading(false);
        return;
      }
      if (!enrollment) {
        setLoading(false);
        return;
      }
      // Get course
      const { data: courseData, error: courseError } =
        await supabase
          .from("courses")
          .select("id, title, description")
          .eq("id", courseId)
          .single();
      if (courseError) {
        console.error("Course error:", courseError);
        setLoading(false);
        return;
      }
      setCourse(courseData);
      // Get lessons
      const { data: lessonsData, error: lessonsError } =
        await supabase
          .from("lessons")
          .select("*")
          .eq("course_id", courseId)
          .order("position", { ascending: true });
      if (lessonsError) {
        console.error("Lessons error:", lessonsError);
      } else {
        const loadedLessons = (lessonsData || []) as Lesson[];
              setLessons(lessonsData ?? []);

        if (lessonsData && lessonsData.length > 0) {
          setSelectedLesson(lessonsData[0]);
        }
      }
      // Get student's lesson progress
      const { data: progressData, error: progressError } =
        await supabase
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("student_id", user.id);
      if (progressError) {
        console.error("Progress error:", progressError);
      } else {
        setProgress((progressData || []) as Progress[]);
      }
      setLoading(false);
    }
    loadCourse();
  }, [courseId]);
  const isCompleted = (lessonId: string) => {
    return progress.some(
      (item) =>
        item.lesson_id === lessonId && item.completed === true
    );
  };
  const handleMarkComplete = async () => {
    if (!selectedLesson) return;
    setMarkingComplete(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      alert("Please log in first.");
      setMarkingComplete(false);
      return;
    }
    // Check if progress already exists
    const { data: existingProgress, error: existingError } =
      await supabase
        .from("lesson_progress")
        .select("id")
        .eq("student_id", user.id)
        .eq("lesson_id", selectedLesson.id)
        .maybeSingle();
    if (existingError) {
      console.error("Progress check error:", existingError);
      alert(existingError.message);
      setMarkingComplete(false);
      return;
    }
    if (existingProgress) {
      // Update existing progress
      const { error } = await supabase
        .from("lesson_progress")
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("id", existingProgress.id);
      if (error) {
        console.error("Progress update error:", error);
        alert(error.message);
        setMarkingComplete(false);
        return;
      }
    } else {
      // Create new progress
      const { error } = await supabase
        .from("lesson_progress")
        .insert({
          student_id: user.id,
          lesson_id: selectedLesson.id,
          completed: true,
          completed_at: new Date().toISOString(),
        });
      if (error) {
        console.error("Progress insert error:", error);
        alert(error.message);
        setMarkingComplete(false);
        return;
      }
    }
    // Update UI
    setProgress((currentProgress) => {
      const exists = currentProgress.some(
        (item) => item.lesson_id === selectedLesson.id
      );
      if (exists) {
        return currentProgress.map((item) =>
          item.lesson_id === selectedLesson.id
            ? {
                ...item,
                completed: true,
              }
            : item
        );
      }
      return [
        ...currentProgress,
        {
          lesson_id: selectedLesson.id,
          completed: true,
        },
      ];
    });
    setMarkingComplete(false);
  };
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-600">Loading course...</p>
        </div>
      </main>
    );
  }
  if (!course) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
            <div className="text-5xl">🔒</div>
            <h1 className="mt-4 text-xl font-semibold text-gray-900">
              Course not available
            </h1>
            <p className="mt-2 text-gray-600">
              You need to be enrolled in this course to access it.
            </p>
            {/* Back Button */}
            <a
              href="/dashboard/student/courses"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              ← Back to My Courses
            </a>
          </div>
        </div>
      </main>
    );
  }
  const completedCount = lessons.filter((lesson) =>
    isCompleted(lesson.id)
  ).length;
  const progressPercentage =
    lessons.length > 0
      ? Math.round((completedCount / lessons.length) * 100)
      : 0;
  // Course is completed when every lesson is completed
  const courseCompleted =
    lessons.length > 0 && completedCount === lessons.length;
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        {/* Back Button */}
        <a
          href="/dashboard/student/courses"
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-100"
        >
          ← Back to My Courses
        </a>
        {/* Course Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-blue-600">
            Student Learning
          </p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            {course.title}
          </h1>
          <p className="mt-2 text-gray-600">
            {course.description || "Start learning this course."}
          </p>
          {/* Course Completed Message */}
          {courseCompleted && (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-xl">
                  ✓
                </div>
                <div>
                  <h2 className="text-lg font-bold text-green-800">
                    Course Completed!
                  </h2>
                  <p className="text-sm text-green-700">
                    Congratulations! You have completed all the lessons in
                    this course.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Course Progress
              </span>
              <span
                className={`text-sm font-semibold ${
                  courseCompleted
                    ? "text-green-600"
                    : "text-blue-600"
                }`}
              >
                {progressPercentage}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all ${
                  courseCompleted
                    ? "bg-green-500"
                    : "bg-blue-600"
                }`}
                style={{
                  width: `${progressPercentage}%`,
                }}
              />
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {completedCount} of {lessons.length} lessons completed
            </p>
          </div>
        </div>
        {/* Main Learning Area */}
        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Lesson List */}
          <aside className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-4 px-2 text-lg font-semibold text-gray-900">
              Course Lessons
            </h2>
            {lessons.length === 0 ? (
              <p className="px-2 text-sm text-gray-500">
                No lessons available yet.
              </p>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full rounded-xl p-3 text-left transition ${
                      selectedLesson?.id === lesson.id
                        ? "bg-blue-50 ring-1 ring-blue-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                        {isCompleted(lesson.id)
                          ? "✓"
                          : index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {lesson.title}
                        </p>
                        {isCompleted(lesson.id) && (
                          <p className="mt-1 text-xs font-medium text-green-600">
                            Completed
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>
          {/* Lesson Content */}
          <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            {selectedLesson ? (
              <>
                <p className="text-sm font-medium text-blue-600">
                  Lesson
                </p>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {selectedLesson.title}
                </h2>
                {selectedLesson.description && (
                  <p className="mt-3 text-gray-600">
                    {selectedLesson.description}
                  </p>
                )}
                {/* Video */}
                <div className="mt-6 overflow-hidden rounded-2xl bg-black">
                  {selectedLesson.video_url ? (
                    <video
                      key={selectedLesson.video_url}
                      src={selectedLesson.video_url}
                      controls
                      className="aspect-video w-full"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center text-white">
                      <p>No video available for this lesson.</p>
                    </div>
                  )}
                </div>
                {/* Complete Button */}
                <div className="mt-6 flex justify-end">
                  {isCompleted(selectedLesson.id) ? (
                    <div className="rounded-xl bg-green-50 px-5 py-3 font-medium text-green-700">
                      ✓ Lesson Completed
                    </div>
                  ) : (
                    <button
                      onClick={handleMarkComplete}
                      disabled={markingComplete}
                      className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {markingComplete
                        ? "Saving..."
                        : "Mark as Completed"}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex min-h-[400px] items-center justify-center">
                <p className="text-gray-500">
                  Select a lesson to start learning.
                </p>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}