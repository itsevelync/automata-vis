import { SubmitEvent, useState } from "react";

const SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result.split(",")[1]);
      } else {
        reject(new Error("Failed to read file."));
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function About() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    const files = formData
      .getAll("images")
      .filter((file): file is File => file instanceof File && file.size > 0);

    if (files.length > 5) {
      setError("Please attach no more than 5 images.");
      return;
    }

    if (files.some((file) => !file.type.startsWith("image/"))) {
      setError("Only image files are allowed.");
      return;
    }

    if (files.some((file) => file.size > 1024 * 1024)) {
      setError("Each image must be smaller than 1 MB.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const attachments = await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          mimeType: file.type,
          data: await fileToBase64(file),
        })),
      );

      const payload = {
        name: formData.get("name"),
        email: formData.get("email"),
        feedback: formData.get("feedback"),
        files: attachments,
      };

      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      setSuccess(true);
      form.reset();
    } catch (error) {
      console.error("Feedback submission failed:", error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <p>
        This tool helps you design, build, and run automata, as well as import
        and export state diagrams as LaTeX.
      </p>

      <p>
        For feedback and inquiries, please fill out the form below. Suggestions,
        bug reports, and ideas for new features are always appreciated. :)
      </p>

      <details>
        <summary>Contact Form</summary>

        {success ? (
          <div className="feedback-form-success">
            <p>Submission sent! Thank you for your message.</p>
            <button onClick={() => setSuccess(false)}>
              Submit another response
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleSubmit}>
            <label htmlFor="name">
              Name
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your name"
              />
            </label>

            <label htmlFor="email">
              Email
              <input
                type="email"
                id="email"
                name="email"
                placeholder="you@example.com"
              />
            </label>

            <p className="muted">
              Name and email are optional. Leave your email if you'd like me to
              follow up.
            </p>

            <label htmlFor="feedback">
              Your Message*
              <textarea
                id="feedback"
                name="feedback"
                rows={4}
                placeholder="Share your message here."
                required
              />
            </label>

            <label htmlFor="images">
              Attach Images
              <p className="muted">
                This is especially helpful for bug reports. Max 5 images, 1 MB
                each.
              </p>
              <input
                type="file"
                id="images"
                name="images"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files;

                  if (files && files.length > 5) {
                    alert("You can upload a maximum of 5 images.");
                    e.target.value = "";
                  }
                }}
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Message"}
            </button>

            {error && <p role="error">{error}</p>}
          </form>
        )}
      </details>

      <h4>Credits</h4>
      <p>
        This website was developed using{" "}
        <a href="https://vite.dev/" target="_blank">
          Vite
        </a>{" "}
        and{" "}
        <a href="https://react.dev/" target="_blank">
          React
        </a>
        , with icons from{" "}
        <a href="https://react-icons.github.io/react-icons/" target="_blank">
          React Icons
        </a>{" "}
        and math typesetting from{" "}
        <a href="https://katex.org/" target="_blank">
          KaTeX
        </a>
        . The source code is available on{" "}
        <a href="https://github.com/itsevelync/automata-vis" target="_blank">
          GitHub
        </a>
        .
      </p>

      <p>
        The educational materials that informed this project are from{" "}
        <a href="https://faculty.cc.gatech.edu/~josephjaeger/" target="_blank">
          Dr. Joseph Jaeger
        </a>{" "}
        and Georgia Tech's CS 4510 course.
      </p>
    </>
  );
}
