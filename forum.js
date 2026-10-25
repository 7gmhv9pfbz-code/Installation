(function () {
  const config = window.FORUM_CONFIG;
  const form = document.getElementById("forum-form");
  const submitButton = document.getElementById("post-submit");
  const status = document.getElementById("forum-status");
  const list = document.getElementById("forum-list");

  function isConfigured() {
    return config
      && typeof config.url === "string"
      && config.url.startsWith("https://")
      && !config.url.includes("PASTE_")
      && typeof config.anonKey === "string"
      && config.anonKey
      && !config.anonKey.includes("PASTE_");
  }

  function apiUrl(query) {
    return config.url.replace(/\/$/, "") + "/rest/v1/forum_posts?" + query;
  }

  async function request(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error("Forum request failed with HTTP " + response.status + ".");
    }
    return response;
  }

  function formatDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "DATE UNAVAILABLE";
    }
    return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
  }

  function showPosts(posts) {
    list.replaceChildren();

    if (posts.length === 0) {
      const empty = document.createElement("p");
      empty.textContent = "No messages have been posted.";
      list.appendChild(empty);
      return;
    }

    posts.forEach(function (post) {
      const article = document.createElement("article");
      const header = document.createElement("header");
      const message = document.createElement("p");

      header.textContent = post.name + " / " + formatDate(post.created_at);
      message.textContent = post.message;
      article.className = "forum-post";
      article.append(header, message);
      list.appendChild(article);
    });
  }

  async function loadPosts() {
    status.textContent = "Loading messages...";
    const response = await request(
      apiUrl("select=id,name,message,created_at&order=created_at.desc&limit=50"),
      {
        headers: {
          apikey: config.anonKey,
          Authorization: "Bearer " + config.anonKey
        }
      }
    );
    showPosts(await response.json());
    status.textContent = "";
  }

  if (!isConfigured()) {
    status.textContent = "Forum setup required: add your Supabase project URL and anon key to config/forum-config.js.";
    form.addEventListener("submit", function (event) {
      event.preventDefault();
    });
    return;
  }

  loadPosts().catch(function (error) {
    console.error(error);
    status.textContent = "Could not load messages. Check the forum setup or try again later.";
  });

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!form.reportValidity()) {
      return;
    }

    const data = new FormData(form);
    const post = {
      name: data.get("name").trim(),
      message: data.get("message").trim()
    };
    if (!post.name || !post.message) {
      status.textContent = "Enter a name and message before posting.";
      return;
    }

    submitButton.disabled = true;
    status.textContent = "Posting message...";
    try {
      await request(apiUrl(""), {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          Authorization: "Bearer " + config.anonKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(post)
      });
      form.reset();
      await loadPosts();
      status.textContent = "Message posted.";
    } catch (error) {
      console.error(error);
      status.textContent = "Could not post your message. Check the forum setup or try again later.";
    } finally {
      submitButton.disabled = false;
    }
  });
}());
