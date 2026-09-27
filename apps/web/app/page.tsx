const categories = [
  {
    icon: "💻",
    title: "Development",
    description: "Web, programming and software development",
  },
  {
    icon: "📊",
    title: "Data & Analytics",
    description: "Data analysis, SQL and business intelligence",
  },
  {
    icon: "🎨",
    title: "Design",
    description: "UI, UX and creative design skills",
  },
];

const steps = [
  {
    number: "01",
    title: "Choose a course",
    description: "Explore courses and find something you want to learn.",
  },
  {
    number: "02",
    title: "Learn at your pace",
    description: "Follow structured lessons and learn whenever you want.",
  },
  {
    number: "03",
    title: "Track your progress",
    description: "Complete lessons and keep track of your learning journey.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">

      {/* NAVBAR */}
      <header className="border-b border-gray-100 bg-white">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          
          <a
            href="/"
            className="text-2xl font-bold tracking-tight"
          >
            Learn<span className="text-indigo-600">Hub</span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#courses"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              Courses
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 transition hover:text-gray-900"
            >
              How it works
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Login
            </a>

            <a
              href="/signup"
              className="rounded-lg bg-gray-300 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700"
            >
              Sign up
            </a>
          </div>

        </nav>
      </header>

      {/* HERO */}
      <section className="bg-gray-50">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-28">

          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm">
              🎓 Learning made simple
            </div>

            <h1 className="max-w-2xl text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
              Build skills.
              <br />
              <span className="text-indigo-600">
                Build your future.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Learn practical skills through structured courses,
              follow your progress, and grow at your own pace.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#courses"
                className="rounded-lg bg-gray-300 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Explore courses →
              </a>

              <a
                href="/signup"
                className="rounded-lg border border-gray-300 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
              >
                Create free account
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
              <span>✓ Structured learning</span>
              <span>✓ Track your progress</span>
              <span>✓ Learn at your pace</span>
            </div>
          </div>

          {/* LEARNING DASHBOARD PREVIEW */}
          <div className="relative">

            <div className="rounded-3xl bg-gray-900 p-3 shadow-2xl">

              <div className="rounded-2xl bg-white p-6">

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400">
                      My learning
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Continue learning
                    </h2>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">
                    👤
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-gray-50 p-5">

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-indigo-600">
                        DEVELOPMENT
                      </p>

                      <h3 className="mt-2 text-lg font-bold">
                        Full Stack Web Development
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Lesson 8 of 24
                      </p>
                    </div>

                    <span className="text-sm font-bold text-indigo-600">
                      65%
                    </span>
                  </div>

                  <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200">
                    <div className="h-full w-[65%] rounded-full bg-indigo-600" />
                  </div>

                  <button className="mt-5 w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white">
                    Continue lesson
                  </button>

                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xl font-bold">8</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Completed
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xl font-bold">16</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Remaining
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-4">
                    <p className="text-xl font-bold">24</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Total lessons
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* CATEGORIES */}
      <section id="courses" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">

          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Explore
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              What do you want to learn?
            </h2>

            <p className="mt-4 text-gray-600">
              Explore different areas and start building skills
              that matter to you.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">

            {categories.map((category) => (
              <div
                key={category.title}
                className="group rounded-2xl border border-gray-200 bg-white p-7 transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >

                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gray-100 text-2xl transition group-hover:bg-indigo-50">
                  {category.icon}
                </div>

                <h3 className="mt-6 text-xl font-bold">
                  {category.title}
                </h3>

                <p className="mt-3 leading-7 text-gray-600">
                  {category.description}
                </p>

                <a
                  href="#"
                  className="mt-6 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Explore →
                </a>

              </div>
            ))}

          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="border-y border-gray-100 bg-gray-50 px-6 py-24"
      >
        <div className="mx-auto max-w-7xl">

          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Simple process
            </p>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              How LearnHub works
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
              Start learning in just a few simple steps.
            </p>
          </div>

          <div className="mt-14 grid gap-10 md:grid-cols-3">

            {steps.map((step) => (
              <div
                key={step.number}
                className="relative text-center"
              >

                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                  {step.number}
                </div>

                <h3 className="mt-6 text-xl font-bold">
                  {step.title}
                </h3>

                <p className="mx-auto mt-3 max-w-sm leading-7 text-gray-600">
                  {step.description}
                </p>

              </div>
            ))}

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl bg-gray-900 px-8 py-16 text-center text-white sm:px-16">

          <p className="text-sm font-semibold uppercase tracking-wider text-indigo-300">
            Start learning today
          </p>

          <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
            Your next skill starts here.
          </h2>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-gray-300">
            Create your account, explore courses, and start
            building your knowledge.
          </p>

          <a
            href="/signup"
            className="mt-8 inline-block rounded-lg bg-white px-7 py-3.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-200"
          >
            Get started for free
          </a>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-100 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xl font-bold">
              Learn<span className="text-indigo-600">Hub</span>
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Learn. Build. Grow.
            </p>
          </div>

          <div className="flex gap-6 text-sm text-gray-500">
            <a
              href="/login"
              className="hover:text-gray-900"
            >
              Login
            </a>

            <a
              href="/signup"
              className="hover:text-gray-900"
            >
              Sign up
            </a>
          </div>

        </div>
      </footer>

    </main>
  );
}