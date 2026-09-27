"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type Course = {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
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

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [lessonVideoUrl, setLessonVideoUrl] = useState("");
  const [lessonPosition, setLessonPosition] = useState(1);

  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(
    null
  );

  const [error, setError] = useState("");
  const [lessonError, setLessonError] = useState("");

  useEffect(() => {
    async function loadCourse() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("courses")
        .select("id, title, description, published")
        .eq("id", courseId)
        .eq("instructor_id", user.id)
        .single();

      if (fetchError || !data) {
        setError("Course not found or you don't have access to it.");
        setLoading(false);
        return;
      }

      setCourse(data);
      setTitle(data.title);
      setDescription(data.description ?? "");
      setPublished(data.published);

      const { data: lessonsData, error: lessonsFetchError } =
        await supabase
          .from("lessons")
          .select(
            "id, course_id, title, description, video_url, position, created_at"
          )
          .eq("course_id", courseId)
          .order("position", { ascending: true });

      if (lessonsFetchError) {
        console.error(lessonsFetchError);
        setLessonError(lessonsFetchError.message);
      } else {
        setLessons(lessonsData ?? []);

        if (lessonsData && lessonsData.length > 0) {
          const highestPosition = Math.max(
            ...lessonsData.map((lesson) => lesson.position)
          );

          setLessonPosition(highestPosition + 1);
        }
      }

      setLoading(false);
    }

    loadCourse();
  }, [courseId, router, supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const { error: updateError } = await supabase
      .from("courses")
      .update({
        title,
        description,
        published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", courseId);

    if (updateError) {
      console.error(updateError);
      setError(updateError.message);
      setSaving(false);
      return;
    }

    setSaving(false);

    // After Save Changes, go to Instructor Dashboard.
    router.push("/dashboard/instructor");
    router.refresh();
  }

  async function handleAddLesson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setAddingLesson(true);
    setLessonError("");

    if (!lessonTitle.trim()) {
      setLessonError("Please enter a lesson title.");
      setAddingLesson(false);
      return;
    }

    let finalVideoUrl = lessonVideoUrl.trim() || null;

    // Upload video if a file was selected
    if (videoFile) {
      setUploadingVideo(true);

      if (!videoFile.type.startsWith("video/")) {
        setLessonError("Please select a valid video file.");
        setUploadingVideo(false);
        setAddingLesson(false);
        return;
      }

      const maxSize = 100 * 1024 * 1024;

      if (videoFile.size > maxSize) {
        setLessonError("Video must be smaller than 100 MB.");
        setUploadingVideo(false);
        setAddingLesson(false);
        return;
      }

      const fileExtension =
        videoFile.name.split(".").pop()?.toLowerCase() || "mp4";

      const fileName = `${courseId}/${Date.now()}-${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("course-videos")
        .upload(fileName, videoFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: videoFile.type,
        });

      if (uploadError) {
        console.error(uploadError);
        setLessonError(uploadError.message);
        setUploadingVideo(false);
        setAddingLesson(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("course-videos")
        .getPublicUrl(fileName);

      finalVideoUrl = publicUrlData.publicUrl;

      setUploadingVideo(false);
    }

    const { error: insertError } = await supabase
      .from("lessons")
      .insert({
        course_id: courseId,
        title: lessonTitle.trim(),
        description: lessonDescription.trim() || null,
        video_url: finalVideoUrl,
        position: lessonPosition,
      });

    if (insertError) {
      console.error(insertError);
      setLessonError(insertError.message);
      setAddingLesson(false);
      return;
    }

    // Lesson created successfully.
    setAddingLesson(false);

    // Go back to instructor dashboard.
    router.push("/dashboard/instructor");
    router.refresh();
  }

  async function handleDeleteLesson(lessonId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lesson?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingLessonId(lessonId);
    setLessonError("");

    const { error: deleteError } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId)
      .eq("course_id", courseId);

    if (deleteError) {
      console.error(deleteError);
      setLessonError(deleteError.message);
      setDeletingLessonId(null);
      return;
    }

    setLessons((currentLessons) =>
      currentLessons.filter((lesson) => lesson.id !== lessonId)
    );

    setDeletingLessonId(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading course...</p>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-200">
          <h1 className="text-2xl font-bold text-red-600">
            Course not found
          </h1>

          <p className="mt-2 text-gray-600">{error}</p>

          <button
            type="button"
            onClick={() =>
              router.push("/dashboard/instructor/courses")
            }
            className="mt-6 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
          >
            Back to Courses
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">

        {/* Back Button */}
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard/instructor/courses")
          }
          className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        >
          ← Back to My Courses
        </button>

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-purple-600">
            Instructor Portal
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Edit Course
          </h1>

          <p className="mt-2 text-gray-600">
            Update your course information and manage lessons.
          </p>
        </div>

        {/* Course Details */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                Course Title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                Description
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                required
                className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4">
              <input
                type="checkbox"
                checked={published}
                onChange={(event) => setPublished(event.target.checked)}
                className="h-4 w-4"
              />

              <div>
                <p className="font-semibold text-gray-900">
                  Publish course
                </p>

                <p className="text-sm text-gray-500">
                  Students can see the course when it is published.
                </p>
              </div>
            </label>

            {error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  router.push("/dashboard/instructor/courses")
                }
                className="rounded-xl border border-gray-300 px-5 py-3 font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>

        {/* Lessons */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
          <div className="mb-6">
            <p className="text-sm font-medium text-purple-600">
              Course Content
            </p>

            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              Lessons
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Add videos and manage the lessons in this course.
            </p>
          </div>

          {/* Existing Lessons */}
          {lessons.length > 0 ? (
            <div className="space-y-3">
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100 font-bold text-purple-700">
                        {lesson.position}
                      </div>

                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {lesson.title}
                        </h3>

                        {lesson.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {lesson.description}
                          </p>
                        )}

                        {lesson.video_url ? (
                          <a
                            href={lesson.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-sm font-medium text-purple-600 hover:text-purple-700"
                          >
                            🎥 Watch Video
                          </a>
                        ) : (
                          <p className="mt-2 text-sm text-gray-400">
                            No video added
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(lesson.id)}
                      disabled={deletingLessonId === lesson.id}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingLessonId === lesson.id
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <div className="text-4xl">📚</div>

              <h3 className="mt-3 font-semibold text-gray-900">
                No lessons yet
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add your first lesson below.
              </p>
            </div>
          )}

          {/* Add Lesson */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h3 className="text-lg font-bold text-gray-900">
              Add New Lesson
            </h3>

            <form onSubmit={handleAddLesson} className="mt-5 space-y-5">

              <div>
                <label
                  htmlFor="lessonTitle"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Lesson Title
                </label>

                <input
                  id="lessonTitle"
                  type="text"
                  value={lessonTitle}
                  onChange={(event) =>
                    setLessonTitle(event.target.value)
                  }
                  placeholder="Example: Introduction to JavaScript"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              <div>
                <label
                  htmlFor="lessonDescription"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Description
                </label>

                <textarea
                  id="lessonDescription"
                  value={lessonDescription}
                  onChange={(event) =>
                    setLessonDescription(event.target.value)
                  }
                  placeholder="What will students learn in this lesson?"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* Video Upload */}
              <div>
                <label
                  htmlFor="videoFile"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Upload Video
                </label>

                <input
                  id="videoFile"
                  type="file"
                  accept="video/*"
                  onChange={(event) =>
                    setVideoFile(event.target.files?.[0] ?? null)
                  }
                  className="w-full cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-purple-100 file:px-4 file:py-2 file:font-semibold file:text-purple-700 hover:file:bg-purple-200"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Maximum file size: 100 MB.
                </p>

                {videoFile && (
                  <p className="mt-2 text-sm text-green-600">
                    Selected: {videoFile.name}
                  </p>
                )}
              </div>

              {/* Video URL */}
              <div>
                <label
                  htmlFor="lessonVideoUrl"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Or Use Video URL
                </label>

                <input
                  id="lessonVideoUrl"
                  type="url"
                  value={lessonVideoUrl}
                  onChange={(event) =>
                    setLessonVideoUrl(event.target.value)
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />

                <p className="mt-2 text-xs text-gray-500">
                  Use either a video upload or a video URL.
                </p>
              </div>

              {/* Position */}
              <div>
                <label
                  htmlFor="lessonPosition"
                  className="mb-2 block text-sm font-semibold text-gray-900"
                >
                  Position
                </label>

                <input
                  id="lessonPosition"
                  type="number"
                  min="1"
                  value={lessonPosition}
                  onChange={(event) =>
                    setLessonPosition(Number(event.target.value))
                  }
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {lessonError && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                  {lessonError}
                </div>
              )}

              <button
                type="submit"
                disabled={addingLesson || uploadingVideo}
                className="w-full rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploadingVideo
                  ? "Uploading Video..."
                  : addingLesson
                    ? "Adding Lesson..."
                    : "Add Lesson"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}