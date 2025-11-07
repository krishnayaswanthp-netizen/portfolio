(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function on(el, ev, fn) { el && el.addEventListener(ev, fn, { passive: true }); }
  function setAttr(el, name, value) { el && el.setAttribute(name, value); }

  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  
  function initPreloader() {
    const preloader = $("#preloader");
    if (!preloader) return;

    window.addEventListener("load", () => {
      setTimeout(() => {
        preloader.classList.add("hidden");
        setTimeout(() => {
          if (preloader.parentNode) {
            preloader.parentNode.removeChild(preloader);
          }
        }, 500);
      }, 500);
    });
  }

  function initThemeToggle() {
    const button = $("#theme-toggle");
    if (!button) return;
    
    const stored = localStorage.getItem("theme");
    let theme = stored || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", theme);
    setAttr(button, "aria-pressed", theme === "dark");

    on(button, "click", () => {
      theme = (document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("theme", theme);
      setAttr(button, "aria-pressed", theme === "dark");
      
      button.classList.add("toggled");
      setTimeout(() => {
        button.classList.remove("toggled");
      }, 300);
    });
    
    // Add keyboard support
    button.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        button.click();
      }
    });
  }

  function initNavToggle() {
    const navToggle = $("#nav-toggle");
    const menu = $("#primary-menu");
    if (!navToggle || !menu) return;
    on(navToggle, "click", () => {
      const isOpen = menu.classList.toggle("open");
      setAttr(navToggle, "aria-expanded", isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target) && !navToggle.contains(e.target)) {
        menu.classList.remove("open");
        setAttr(navToggle, "aria-expanded", false);
      }
    });
  }

  function initSmoothScroll() {
    const links = $$('a[href^="#"]');
    links.forEach(link => {
      if (link.getAttribute("href") === "#") return;
      on(link, "click", (e) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        const target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        const menu = $("#primary-menu");
        if (menu && menu.classList.contains("open")) {
          menu.classList.remove("open");
          const navToggle = $("#nav-toggle");
          if (navToggle) setAttr(navToggle, "aria-expanded", false);
        }
        setTimeout(() => target.setAttribute("tabindex", "-1"), 400);
      });
    });
  }

  function initScrollReveal() {
    const reveals = $$(".--reveal");
    if (!("IntersectionObserver" in window) || reveals.length === 0) {
      reveals.forEach(r => r.classList.add("visible"));
      return;
    }
    
    const observerOptions = {
      threshold: 0.12,
      rootMargin: "0px 0px -50px 0px"
    };
    
    const obs = new IntersectionObserver(throttle((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          if (entry.target.id === "skills" || entry.target.querySelectorAll(".progress-bar").length) {
            animateSkillBars();
          }
          obs.unobserve(entry.target);
        }
      });
    }, 100), observerOptions);
    
    reveals.forEach(el => obs.observe(el));
  }

  function initTyping() {
    const el = $("#typing-text");
    if (!el) return;
    const phrases = ["Full Stack Developer", "Java Expert", "Python Developer", "JavaScript Enthusiast", "UI/UX Designer", "AI/ML Explorer", "Problem Solver"];
    let idx = 0;
    let charIndex = 0;
    let deleting = false;
    const speed = 50;

    function tick() {
      const current = phrases[idx % phrases.length];
      if (!deleting) {
        el.textContent = current.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex >= current.length) {
          deleting = true;
          setTimeout(tick, 900);
          return;
        }
      } else {
        el.textContent = current.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex <= 0) {
          deleting = false;
          idx++;
        }
      }
      setTimeout(() => requestAnimationFrame(tick), deleting ? speed / 2 : speed);
    }
    tick();
  }

  function animateSkillBars() {
    const bars = $$(".progress-bar");
    bars.forEach(bar => {
      const target = Number(bar.getAttribute("data-target") || 0);
      if (bar.dataset.animated) return;
      bar.style.width = target + "%";
      bar.dataset.animated = "true";
      const parent = bar.closest(".skill");
      if (parent) {
        const valueEl = parent.querySelector(".skill-value");
        if (valueEl) {
          countUp(valueEl, 0, target, 900);
        }
      }
    });
  }

  function countUp(el, start, end, duration) {
    const stepTime = Math.abs(Math.floor(duration / (end - start || 1)));
    let current = start;
    const step = () => {
      current++;
      el.textContent = current + "%";
      if (current < end) {
        setTimeout(step, stepTime);
      } else {
        el.textContent = end + "%";
      }
    };
    step();
  }

  function initProjectFilters() {
    const chips = $$(".chip");
    const grid = $("#project-grid");
    if (!chips.length || !grid) return;

    chips.forEach(chip => {
      on(chip, "click", () => {
        chips.forEach(c => c.classList.remove("active"));
        chips.forEach(c => setAttr(c, "aria-pressed", "false"));
        chip.classList.add("active");
        setAttr(chip, "aria-pressed", "true");

        const filter = chip.dataset.filter;
        const cards = $$(".project-card", grid);
        cards.forEach(card => {
          const tags = (card.dataset.tags || "").split(",").map(t => t.trim());
          if (filter === "all" || tags.includes(filter)) {
            card.style.display = "";
            // Use timeout to ensure smooth transition
            setTimeout(() => card.classList.add("visible"), 10);
          } else {
            card.style.display = "none";
            card.classList.remove("visible");
          }
        });
      });
    });

    const active = chips.find(c => c.classList.contains("active"));
    if (active) {
      // Use a slight delay to ensure DOM is ready
      setTimeout(() => active.click(), 100);
    }
  }

  function initModal() {
    const openButtons = $$(".js-open-modal");
    const modal = $("#project-modal");
    const backdrop = modal ? modal.querySelector(".modal-backdrop") : null;
    const closeEls = modal ? $$(".modal-close, [data-close='true']", modal) : [];

    const projectDetails = {
      "Bank management System": {
        title: "Bank Management System using Java (AWT)",
        description: "A comprehensive banking application developed using Java AWT for the frontend and MySQL for the backend database. This system allows users to perform various banking operations such as account creation, deposits, withdrawals, fund transfers, and balance inquiries. The application features a user-friendly interface with secure authentication mechanisms and robust data handling.",
        technologies: ["Java", "AWT", "MySQL", "JDBC"],
        features: [
          "User authentication and account management",
          "Secure transaction processing",
          "Database integration with MySQL",
          "Intuitive GUI with Java AWT",
          "Transaction history and reporting"
        ]
      },
      "Live Cricket Score": {
        title: "Live Cricket Score Card Based on Official Cricbuzz Report",
        description: "A web scraping project that extracts real-time cricket score data from the official Cricbuzz website. The application provides up-to-date match information, player statistics, and live commentary in a clean, easy-to-read format. Built with Python, this tool demonstrates effective data extraction and presentation techniques.",
        technologies: ["Python", "Web Scraping", "BeautifulSoup", "Requests"],
        features: [
          "Real-time score extraction from Cricbuzz",
          "Match summary and player statistics",
          "Live commentary integration",
          "Data parsing and formatting",
          "User-friendly presentation layer"
        ]
      },
      "Volume Control System": {
        title: "Volume Control System Using Hand Gesture Recognition",
        description: "An innovative project that uses computer vision to control system volume through hand gestures. By detecting specific hand movements captured via webcam, users can increase, decrease, or mute system volume without physical interaction. This project showcases the practical application of image processing and gesture recognition technologies.",
        technologies: ["Python", "OpenCV", "MediaPipe", "Computer Vision"],
        features: [
          "Real-time hand gesture detection",
          "Volume control through finger movements",
          "Webcam integration for gesture capture",
          "Intuitive gesture mapping system",
          "Cross-platform compatibility"
        ]
      },
      "Portfolio Website": {
        title: "Personal Portfolio Website",
        description: "A responsive, modern portfolio website designed to showcase projects, skills, and professional experience. Built with HTML, CSS, and vanilla JavaScript, this website features smooth animations, dark/light mode toggle, lazy loading, and mobile-first responsive design. The site is optimized for performance and accessibility.",
        technologies: ["HTML5", "CSS3", "JavaScript", "Responsive Design"],
        features: [
          "Fully responsive design for all devices",
          "Dark/light mode toggle with localStorage persistence",
          "Smooth animations and scroll effects",
          "Lazy loading for improved performance",
          "Accessible design with ARIA attributes",
          "SEO optimized with meta tags and structured data",
          "Interactive project filtering system",
          "Contact form with validation"
        ]
      }
    };

    function openModal(projectKey) {
      if (!modal) return;
      
      const project = projectDetails[projectKey] || {
        title: projectKey,
        description: "Detailed description for " + projectKey + ". Replace with your real content and screenshots.",
        technologies: ["Technology 1", "Technology 2"],
        features: ["Feature 1", "Feature 2", "Feature 3"]
      };
      
      $("#modal-title").textContent = project.title;
      
      let content = `<p>${project.description}</p>`;
      content += `<h4>Technologies Used</h4><ul>`;
      project.technologies.forEach(tech => {
        content += `<li>${tech}</li>`;
      });
      content += `</ul>`;
      
      content += `<h4>Key Features</h4><ul>`;
      project.features.forEach(feature => {
        content += `<li>${feature}</li>`;
      });
      content += `</ul>`;
      
      $("#modal-desc").innerHTML = content;
      
      const codeButton = modal.querySelector(".modal-actions .btn-ghost");
      if (codeButton) {
        // Set project-specific links
        let projectLink = "https://github.com/krishnayaswanthp-netizen";
        if (projectKey === "Bank management System") {
          projectLink = "https://github.com/krishnayaswanthp-netizen/project-1.git";
        } else if (projectKey === "Live Cricket Score") {
          projectLink = "https://github.com/krishnayaswanthp-netizen/cricket-score.git";
        } else if (projectKey === "Volume Control System") {
          projectLink = "https://github.com/krishnayaswanthp-netizen/volume-control-system-using-hand-gesture-recognition.git";
        } else if (projectKey === "Portfolio Website") {
          projectLink = "https://github.com/krishnayaswanthp-netizen/portfolio-website.git";
        }
        codeButton.href = projectLink;
        codeButton.target = "_blank";
        codeButton.rel = "noopener";
        codeButton.textContent = "View Code";
      }
      
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const closeBtn = modal.querySelector(".modal-close");
      if (closeBtn) closeBtn.focus();
      trapFocus(modal);
    }

    function closeModal() {
      if (!modal) return;
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      releaseFocus();
    }

    openButtons.forEach(btn => on(btn, "click", (e) => {
      const project = btn.dataset.project || "Project";
      openModal(project);
    }));

    closeEls.forEach(el => on(el, "click", closeModal));
    if (backdrop) on(backdrop, "click", closeModal);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    let lastFocused = null;
    function trapFocus(root) {
      lastFocused = document.activeElement;
      const focusable = getFocusable(root);
      if (!focusable.length) return;
      focusable[0].focus();
      root.addEventListener("keydown", handleTrap);
    }
    function releaseFocus() {
      const root = modal;
      if (!root) return;
      root.removeEventListener("keydown", handleTrap);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }
    function handleTrap(e) {
      if (e.key !== "Tab") return;
      const focusable = getFocusable(modal);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    function getFocusable(root) {
      return Array.from(root.querySelectorAll('a[href], button:not([disabled]), textarea, input, select')).filter(el => el.offsetParent !== null);
    }
  }

  function initForm() {
    const form = $("#contact-form");
    const toast = $("#form-toast");
    const submitBtn = form.querySelector("button[type='submit']");
    if (!form) return;
    
    // Initialize button state
    submitBtn.disabled = true;
    checkFormValidity(); // Check initial state
    form.addEventListener("input", checkFormValidity);
    
    form.name.addEventListener("blur", () => {
      if (!form.name.value.trim()) {
        showError(form.name, "fill out this text-box");
      }
    });
    
    form.email.addEventListener("blur", () => {
      if (!form.email.value.trim()) {
        showError(form.email, "fill out this text-box");
      } else if (!/\S+@\S+\.\S+/.test(form.email.value.trim())) {
        showError(form.email, "Please enter a valid email address");
      }
    });
    
    form.message.addEventListener("blur", () => {
      if (!form.message.value.trim()) {
        showError(form.message, "fill out this text-box");
      }
    });
    
    on(form, "submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      
      clearErrors();
      
      let isValid = true;
      
      if (!name) {
        showError(form.name, "fill out this text-box");
        isValid = false;
      }
      
      if (!email) {
        showError(form.email, "fill out this text-box");
        isValid = false;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        showError(form.email, "Please enter a valid email address");
        isValid = false;
      }
      
      if (!message) {
        showError(form.message, "fill out this text-box");
        isValid = false;
      }
      
      if (!isValid) {
        showToast("Please fill out all fields correctly", true);
        return false;
      }
      
      submitFormAjax(name, email, message);
      return false;
    });
    
    form.name.addEventListener("input", () => {
      if (form.name.value.trim()) {
        clearError(form.name);
      }
      checkFormValidity();
    });
    
    form.email.addEventListener("input", () => {
      if (form.email.value.trim()) {
        clearError(form.email);
      }
      checkFormValidity();
    });
    
    form.message.addEventListener("input", () => {
      if (form.message.value.trim()) {
        clearError(form.message);
      }
      checkFormValidity();
    });

    function checkFormValidity() {
      const name = form.name.value.trim();
      const email = form.email.value.trim();
      const message = form.message.value.trim();
      
      const isEmailValid = email && /\S+@\S+\.\S+/.test(email);
      
      if (name && isEmailValid && message) {
        submitBtn.disabled = false;
      } else {
        submitBtn.disabled = true;
      }
    }

    function showError(field, message) {
      clearError(field);
      field.classList.add("error");
      const errorEl = document.createElement("div");
      errorEl.className = "field-error";
      errorEl.textContent = message;
      field.parentNode.insertBefore(errorEl, field.nextSibling);
    }
    
    function clearError(field) {
      field.classList.remove("error");
      const errorEl = field.parentNode.querySelector(".field-error");
      if (errorEl) {
        errorEl.remove();
      }
    }
    
    function clearErrors() {
      const errorFields = $$(".error");
      errorFields.forEach(field => field.classList.remove("error"));
      
      const errorMessages = $$(".field-error");
      errorMessages.forEach(el => el.remove());
    }
    
    function submitFormAjax(name, email, message) {
      const submitBtn = form.querySelector("button[type='submit']");
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;
      
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("message", message);
      
      fetch("https://formspree.io/f/meordgjn", {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json"
        }
      })
      .then(response => {
        if (response.ok) {
          showToast("Your response has been received. You can expect a response shortly.", false);
          form.reset();
          submitBtn.disabled = true;
          checkFormValidity(); // Ensure button state is updated after reset
        } else {
          showToast("Failed to send message. Please try again later.", true);
          submitBtn.disabled = false;
        }
      })
      .catch(error => {
        showToast("Failed to send message. Please try again later.", true);
        submitBtn.disabled = false;
      })
      .finally(() => {
        if (submitBtn.textContent === "Sending...") {
          submitBtn.textContent = originalText;
        }
      });
    }
    
    function showToast(msg, isError) {
      if (!toast) return;
      toast.textContent = msg;
      toast.style.color = isError ? "tomato" : "inherit";
      toast.style.opacity = "1";
      toast.classList.add("show");
      setTimeout(() => {
        toast.classList.remove("show");
        toast.style.opacity = "0";
      }, 5000);
    }
  }

  function initLazyLoading() {
    const images = $$("img.lazy");
    if (!images.length) return;

    if ("IntersectionObserver" in window) {
      const imageObserver = new IntersectionObserver(throttle((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const image = entry.target;
            image.src = image.dataset.src;
            image.classList.add("loaded");
            imageObserver.unobserve(image);
          }
        });
      }, 100), {
        rootMargin: "50px 0px"
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      images.forEach(img => {
        img.src = img.dataset.src;
        img.classList.add("loaded");
      });
    }
  }

  function initInteractiveElements() {
    const projectCards = $$(".project-card");
    projectCards.forEach(card => {
      card.addEventListener("mouseenter", () => {
        card.classList.add("hovered");
      });
      
      card.addEventListener("mouseleave", () => {
        card.classList.remove("hovered");
      });
    });
    
    const buttons = $$("button, .btn");
    buttons.forEach(button => {
      button.addEventListener("click", function(e) {
        const ripple = document.createElement("span");
        ripple.classList.add("ripple");
        this.appendChild(ripple);
        setTimeout(() => {
          ripple.remove();
        }, 600);
      });
    });
    
    const socialLinks = $$(".social-link");
    socialLinks.forEach(link => {
      link.addEventListener("mouseenter", function() {
        this.classList.add("animated");
      });
      
      link.addEventListener("mouseleave", function() {
        this.classList.remove("animated");
      });
    });
  }

  function init() {
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    initPreloader();
    initThemeToggle();
    initNavToggle();
    initSmoothScroll();
    initScrollReveal();
    initTyping();
    initProjectFilters();
    initModal();
    initForm();
    initLazyLoading();
    initInteractiveElements();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
