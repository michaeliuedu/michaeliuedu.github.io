(function () {
  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    var reduceThemeMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    var getTheme = function () {
      return document.documentElement.getAttribute("data-theme") === "dark"
        ? "dark"
        : "light";
    };

    var applyTheme = function (theme) {
      if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {}
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    };

    applyTheme(getTheme());

    var splashReveal = function (x, y, nextTheme, onDone) {
      var overlay = document.createElement("div");
      overlay.className = "theme-splash";
      overlay.setAttribute("aria-hidden", "true");
      var maxRadius = Math.ceil(
        Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        )
      );
      overlay.style.setProperty("--splash-x", x + "px");
      overlay.style.setProperty("--splash-y", y + "px");
      overlay.style.setProperty("--splash-r", maxRadius + "px");
      overlay.style.setProperty(
        "--splash-color",
        nextTheme === "dark" ? "#12161a" : "#ffffff"
      );
      document.body.appendChild(overlay);

      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          overlay.classList.add("is-expanding");
        });
      });

      var finished = false;
      var finish = function () {
        if (finished) return;
        finished = true;
        onDone();
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      };

      overlay.addEventListener("transitionend", finish, { once: true });
      window.setTimeout(finish, 650);
    };

    var circleFromClick = function (event) {
      var rect = themeToggle.getBoundingClientRect();
      var x =
        event && typeof event.clientX === "number"
          ? event.clientX
          : rect.left + rect.width / 2;
      var y =
        event && typeof event.clientY === "number"
          ? event.clientY
          : rect.top + rect.height / 2;
      return { x: x, y: y };
    };

    themeToggle.addEventListener("click", function (event) {
      var nextTheme = getTheme() === "dark" ? "light" : "dark";
      var point = circleFromClick(event);

      if (reduceThemeMotion.matches) {
        applyTheme(nextTheme);
        return;
      }

      if (typeof document.startViewTransition === "function") {
        var root = document.documentElement;
        var endRadius = Math.hypot(
          Math.max(point.x, window.innerWidth - point.x),
          Math.max(point.y, window.innerHeight - point.y)
        );

        var transition = document.startViewTransition(function () {
          applyTheme(nextTheme);
        });

        transition.ready
          .then(function () {
            root.animate(
              [
                {
                  clipPath:
                    "circle(0px at " + point.x + "px " + point.y + "px)",
                },
                {
                  clipPath:
                    "circle(" +
                    endRadius +
                    "px at " +
                    point.x +
                    "px " +
                    point.y +
                    "px)",
                },
              ],
              {
                duration: 560,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                pseudoElement: "::view-transition-new(root)",
              }
            );
          })
          .catch(function () {
            applyTheme(nextTheme);
          });
        return;
      }

      splashReveal(point.x, point.y, nextTheme, function () {
        applyTheme(nextTheme);
      });
    });
  }

  (function initCopyEmail() {
    var triggers = document.querySelectorAll(".copy-email");
    if (!triggers.length) return;
    var hideTimers = new WeakMap();

    var copyText = function (text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
      }
      return new Promise(function (resolve, reject) {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.left = "-9999px";
        document.body.appendChild(area);
        area.select();
        try {
          document.execCommand("copy");
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          document.body.removeChild(area);
        }
      });
    };

    triggers.forEach(function (el) {
      var tip = el.querySelector(".copy-email__tip");
      el.addEventListener("click", function () {
        var email = el.getAttribute("data-email");
        if (!email) return;

        copyText(email)
          .then(function () {
            if (tip) tip.textContent = "COPIED!";
            el.classList.add("is-copied");
            var prev = hideTimers.get(el);
            if (prev) window.clearTimeout(prev);
            hideTimers.set(
              el,
              window.setTimeout(function () {
                el.classList.remove("is-copied");
              }, 1400)
            );
          })
          .catch(function () {
            if (tip) tip.textContent = "failed";
            el.classList.add("is-copied");
            var prev = hideTimers.get(el);
            if (prev) window.clearTimeout(prev);
            hideTimers.set(
              el,
              window.setTimeout(function () {
                el.classList.remove("is-copied");
                if (tip) tip.textContent = "COPIED!";
              }, 1400)
            );
          });
      });
    });
  })();

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (item) {
      item.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  (function initSectionNav() {
    if (!nav) return;

    var navLinks = Array.prototype.slice.call(nav.querySelectorAll("a[href]"));
    var currentFile = (
      window.location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();

    var isSamePageHref = function (path) {
      if (!path || path === "." || path === "./") return true;
      var linkFile = path.split("/").pop().toLowerCase();
      if (!linkFile) return true;
      if (linkFile === currentFile) return true;
      return (
        linkFile === "index.html" &&
        (currentFile === "" || currentFile === "index.html")
      );
    };

    var entries = [];
    navLinks.forEach(function (link) {
      var href = link.getAttribute("href") || "";
      var hashIndex = href.indexOf("#");
      if (hashIndex === -1) return;

      var path = href.slice(0, hashIndex);
      var id = href.slice(hashIndex + 1);
      if (!id || !isSamePageHref(path)) return;

      var el = document.getElementById(id);
      if (!el) return;

      entries.push({ id: id, link: link, el: el });
    });

    if (!entries.length) return;

    entries.sort(function (a, b) {
      return a.el.offsetTop - b.el.offsetTop;
    });

    var lockId = null;
    var lockTimer = null;

    var setActive = function (id) {
      navLinks.forEach(function (link) {
        link.removeAttribute("aria-current");
      });
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
          entries[i].link.setAttribute("aria-current", "page");
          break;
        }
      }
    };

    var headerOffset = function () {
      var header = document.querySelector(".site-header");
      return header ? header.offsetHeight : 0;
    };

    var syncFromScroll = function () {
      if (lockId) return;

      var marker = window.scrollY + headerOffset() + 32;
      var activeId = entries[0].id;

      for (var i = 0; i < entries.length; i++) {
        var top =
          entries[i].el.getBoundingClientRect().top + window.scrollY;
        if (top <= marker) activeId = entries[i].id;
      }

      var atBottom =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 4;
      if (atBottom) activeId = entries[entries.length - 1].id;

      setActive(activeId);
    };

    var lockActive = function (id) {
      lockId = id;
      setActive(id);
      if (lockTimer) window.clearTimeout(lockTimer);
      lockTimer = window.setTimeout(function () {
        lockId = null;
        syncFromScroll();
      }, 900);
    };

    var activateFromHash = function (hash) {
      var id = (hash || "").replace(/^#/, "");
      if (!id) return false;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
          lockActive(id);
          return true;
        }
      }
      return false;
    };

    entries.forEach(function (entry) {
      entry.link.addEventListener("click", function () {
        lockActive(entry.id);
      });
    });

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      if (nav.contains(anchor)) return;
      var id = (anchor.getAttribute("href") || "").slice(1);
      if (!id) return;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
          anchor.addEventListener("click", function () {
            lockActive(id);
          });
          break;
        }
      }
    });

    window.addEventListener("scroll", syncFromScroll, { passive: true });
    window.addEventListener("hashchange", function () {
      if (!activateFromHash(window.location.hash)) syncFromScroll();
    });

    if (!activateFromHash(window.location.hash)) syncFromScroll();
  })();

  var backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    function scrollOpts() {
      return { top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" };
    }

    function onScroll() {
      if (window.scrollY > 320) {
        backToTop.classList.add("is-visible");
      } else {
        backToTop.classList.remove("is-visible");
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    backToTop.addEventListener("click", function () {
      window.scrollTo(scrollOpts());
      backToTop.blur();
    });
  }

  var bearButton = document.getElementById("bear-button");
  if (bearButton) {
    var teddyLayer = null;
    var reduceTeddy = window.matchMedia("(prefers-reduced-motion: reduce)");

    var ensureTeddyLayer = function () {
      if (!teddyLayer) {
        teddyLayer = document.createElement("div");
        teddyLayer.className = "teddy-layer";
        teddyLayer.setAttribute("aria-hidden", "true");
        document.body.appendChild(teddyLayer);
      }
      return teddyLayer;
    };

    var spawnBears = function () {
      var layer = ensureTeddyLayer();
      var origin = bearButton.getBoundingClientRect();
      var startX = origin.left + origin.width / 2;
      var startY = origin.top + origin.height / 2;
      var count = reduceTeddy.matches ? 12 : 20;
      var spread = Math.max(window.innerWidth * 0.55, 280);

      for (var i = 0; i < count; i++) {
        var bear = document.createElement("span");
        bear.className = "teddy-bear";
        bear.textContent = "🧸";

        // Fan left/right across most of the viewport, then fall down.
        var dx = (Math.random() - 0.5) * spread * 2;
        var dy = -40 - Math.random() * 120;
        var size = 2.8 + Math.random() * 2.6;
        var duration = reduceTeddy.matches
          ? 1.2
          : 1.9 + Math.random() * 1.1;
        var rotStart = (Math.random() - 0.5) * 50;
        var rotEnd =
          rotStart +
          (Math.random() > 0.5 ? 1 : -1) * (120 + Math.random() * 220);

        bear.style.setProperty("--teddy-x", startX + "px");
        bear.style.setProperty("--teddy-y", startY + "px");
        bear.style.setProperty("--teddy-dx", dx + "px");
        bear.style.setProperty("--teddy-dy", dy + "px");
        bear.style.setProperty("--teddy-size", size + "rem");
        bear.style.setProperty("--teddy-duration", duration + "s");
        bear.style.setProperty("--teddy-rot-start", rotStart + "deg");
        bear.style.setProperty("--teddy-rot-end", rotEnd + "deg");
        bear.style.animationDelay = Math.random() * 0.15 + "s";

        layer.appendChild(bear);
        (function (el, ms) {
          window.setTimeout(function () {
            if (el.parentNode) el.parentNode.removeChild(el);
          }, ms);
        })(bear, (duration + 0.35) * 1000);
      }
    };

    bearButton.addEventListener("click", spawnBears);
  }

  var skillItems = document.querySelectorAll(".skill-icons li[data-name]");
  if (skillItems.length) {
    var clearSkillActive = function () {
      skillItems.forEach(function (item) {
        item.classList.remove("is-active");
      });
    };

    skillItems.forEach(function (item) {
      item.setAttribute("tabindex", "0");
      item.setAttribute("role", "button");
      item.setAttribute(
        "aria-label",
        item.getAttribute("data-name") || "Skill"
      );

      item.addEventListener("click", function (event) {
        event.stopPropagation();
        var wasActive = item.classList.contains("is-active");
        clearSkillActive();
        if (!wasActive) {
          item.classList.add("is-active");
        }
      });

      item.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          item.click();
        } else if (event.key === "Escape") {
          item.classList.remove("is-active");
          item.blur();
        }
      });
    });

    document.addEventListener("click", clearSkillActive);
  }

  var typewriterLines = document.querySelectorAll(".typewriter-line");
  if (typewriterLines.length) {
    var typeReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    var typeLines = Array.prototype.slice.call(typewriterLines);
    var charDelay = 26;
    var linePause = 140;
    var interestList = document.querySelector(".interest-list");

    if (interestList) interestList.classList.add("js-typewriter");

    var revealLineShell = function (el) {
      var item = el.closest("li");
      if (item) {
        item.classList.add("is-typing-line");
      }
    };

    var finishLineShell = function (el) {
      var item = el.closest("li");
      if (item) {
        item.classList.remove("is-typing-line");
        item.classList.add("is-typed");
      }
    };

    var finishTypewriter = function () {
      typeLines.forEach(function (el) {
        finishLineShell(el);
      });
    };

    var runTypewriter = function (lineIndex) {
      if (lineIndex >= typeLines.length) {
        finishTypewriter();
        return;
      }

      var el = typeLines[lineIndex];
      var text = el.getAttribute("data-text") || "";
      var charIndex = 0;

      revealLineShell(el);
      el.classList.add("is-typing");
      el.textContent = "";

      var typeChar = function () {
        if (charIndex < text.length) {
          el.textContent = text.slice(0, charIndex + 1);
          charIndex += 1;
          window.setTimeout(typeChar, charDelay);
          return;
        }

        el.classList.remove("is-typing");
        finishLineShell(el);
        window.setTimeout(function () {
          runTypewriter(lineIndex + 1);
        }, linePause);
      };

      typeChar();
    };

    if (typeReduce.matches) {
      typeLines.forEach(function (el) {
        el.textContent = el.getAttribute("data-text") || "";
        finishLineShell(el);
      });
      finishTypewriter();
    } else {
      runTypewriter(0);
    }
  }

  var revealLists = document.querySelectorAll(".project-showcase");
  var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (revealLists.length) {
    var reveal = function (item) {
      item.classList.add("in-view");
    };

    var hide = function (item) {
      item.classList.remove("in-view");
      item.style.removeProperty("--reveal-delay");
    };

    var afterPaint = function (callback) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(callback);
      });
    };

    var viewportH = function () {
      return window.innerHeight || document.documentElement.clientHeight;
    };

    var isAboveViewportBottom = function (item) {
      return item.getBoundingClientRect().top < viewportH();
    };

    revealLists.forEach(function (list) {
      list.classList.add("js-reveal");
      var items = list.querySelectorAll(":scope > li");

      if (prefersReduce.matches || !("IntersectionObserver" in window)) {
        items.forEach(reveal);
        return;
      }

      var visibleItems = [];
      var belowFoldItems = [];

      items.forEach(function (item) {
        if (isAboveViewportBottom(item)) {
          visibleItems.push(item);
        } else {
          belowFoldItems.push(item);
        }
      });

      var scrollObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.style.removeProperty("--reveal-delay");
              reveal(entry.target);
            } else {
              hide(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
      );

      belowFoldItems.forEach(function (item) {
        scrollObserver.observe(item);
      });

      afterPaint(function () {
        visibleItems.forEach(function (item, index) {
          item.style.setProperty(
            "--reveal-delay",
            String(0.06 + index * 0.14) + "s"
          );
          reveal(item);
        });

        var entranceMs = visibleItems.length * 140 + 700;
        window.setTimeout(function () {
          visibleItems.forEach(function (item) {
            scrollObserver.observe(item);
          });
        }, entranceMs);
      });
    });
  }

  (function initProjectCarousels() {
    var carousels = document.querySelectorAll("[data-carousel]");
    if (!carousels.length) return;

    var backdrop = document.createElement("div");
    backdrop.className = "image-lightbox";
    backdrop.setAttribute("hidden", "");
    backdrop.innerHTML =
      '<button type="button" class="image-lightbox__nav image-lightbox__nav--prev" aria-label="Previous image">&#8249;</button>' +
      '<button type="button" class="image-lightbox__nav image-lightbox__nav--next" aria-label="Next image">&#8250;</button>' +
      '<div class="image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Enlarged project image">' +
      '<button type="button" class="image-lightbox__close" aria-label="Close">&times;</button>' +
      '<img class="image-lightbox__img" alt="" />' +
      "</div>" +
      '<div class="image-lightbox__progress" role="tablist" aria-label="Carousel progress" hidden></div>';
    document.body.appendChild(backdrop);

    var dialog = backdrop.querySelector(".image-lightbox__dialog");
    var lbImg = backdrop.querySelector(".image-lightbox__img");
    var closeBtn = backdrop.querySelector(".image-lightbox__close");
    var lbPrev = backdrop.querySelector(".image-lightbox__nav--prev");
    var lbNext = backdrop.querySelector(".image-lightbox__nav--next");
    var lbProgress = backdrop.querySelector(".image-lightbox__progress");
    var lastFocus = null;
    var activeCarousel = null;

    var closeLightbox = function () {
      if (!backdrop.classList.contains("is-open")) return;
      backdrop.classList.remove("is-open");
      backdrop.setAttribute("hidden", "");
      document.body.classList.remove("is-lightbox-open");
      activeCarousel = null;
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
      lastFocus = null;
    };

    var syncLightboxProgress = function (carousel) {
      var slides = carousel.querySelectorAll(".project-carousel__slide");
      var index = currentIndex(carousel);
      var multi = slides.length > 1;
      lbProgress.hidden = !multi;
      lbProgress.innerHTML = "";
      if (!multi) return;

      for (var i = 0; i < slides.length; i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className =
          "image-lightbox__dot" + (i === index ? " is-active" : "");
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Image " + (i + 1) + " of " + slides.length);
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
        (function (dotIndex) {
          dot.addEventListener("click", function (event) {
            event.stopPropagation();
            if (activeCarousel) goTo(activeCarousel, dotIndex);
          });
        })(i);
        lbProgress.appendChild(dot);
      }
    };

    var syncLightbox = function (carousel) {
      var active = carousel.querySelector(
        ".project-carousel__slide.is-active .project-carousel__image"
      );
      if (!active) return;
      lbImg.src = active.currentSrc || active.src;
      lbImg.alt = active.alt || "Project image";
      var multi = carousel.querySelectorAll(".project-carousel__slide").length > 1;
      lbPrev.hidden = !multi;
      lbNext.hidden = !multi;
      syncLightboxProgress(carousel);
    };

    var openLightbox = function (carousel, trigger) {
      activeCarousel = carousel;
      lastFocus = trigger || document.activeElement;
      syncLightbox(carousel);
      backdrop.removeAttribute("hidden");
      backdrop.classList.add("is-open");
      document.body.classList.add("is-lightbox-open");
      closeBtn.focus();
    };

    var goTo = function (carousel, index) {
      var slides = Array.prototype.slice.call(
        carousel.querySelectorAll(".project-carousel__slide")
      );
      if (!slides.length) return;
      var next = ((index % slides.length) + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === next);
      });
      var dots = carousel.querySelectorAll(".project-carousel__dot");
      dots.forEach(function (dot, i) {
        dot.classList.toggle("is-active", i === next);
        dot.setAttribute("aria-selected", i === next ? "true" : "false");
      });
      if (activeCarousel === carousel && backdrop.classList.contains("is-open")) {
        syncLightbox(carousel);
      }
    };

    var currentIndex = function (carousel) {
      var slides = carousel.querySelectorAll(".project-carousel__slide");
      for (var i = 0; i < slides.length; i++) {
        if (slides[i].classList.contains("is-active")) return i;
      }
      return 0;
    };

    carousels.forEach(function (carousel) {
      var slides = carousel.querySelectorAll(".project-carousel__slide");
      var viewport = carousel.querySelector(".project-carousel__viewport");
      var prev = carousel.querySelector(".project-carousel__btn--prev");
      var next = carousel.querySelector(".project-carousel__btn--next");
      var dotsWrap = carousel.querySelector(".project-carousel__dots");

      if (dotsWrap && slides.length > 1) {
        slides.forEach(function (_, i) {
          var dot = document.createElement("button");
          dot.type = "button";
          dot.className =
            "project-carousel__dot" + (i === 0 ? " is-active" : "");
          dot.setAttribute("role", "tab");
          dot.setAttribute("aria-label", "Image " + (i + 1));
          dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
          dot.addEventListener("click", function (event) {
            event.stopPropagation();
            goTo(carousel, i);
          });
          dotsWrap.appendChild(dot);
        });
      }

      if (prev) {
        prev.addEventListener("click", function (event) {
          event.stopPropagation();
          goTo(carousel, currentIndex(carousel) - 1);
        });
      }
      if (next) {
        next.addEventListener("click", function (event) {
          event.stopPropagation();
          goTo(carousel, currentIndex(carousel) + 1);
        });
      }

      if (viewport) {
        viewport.addEventListener("click", function (event) {
          if (event.target.closest(".project-carousel__btn, .project-carousel__dot")) {
            return;
          }
          openLightbox(carousel, viewport);
        });
        viewport.addEventListener("keydown", function (event) {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openLightbox(carousel, viewport);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(carousel, currentIndex(carousel) - 1);
          } else if (event.key === "ArrowRight") {
            event.preventDefault();
            goTo(carousel, currentIndex(carousel) + 1);
          }
        });
      }
    });

    closeBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      closeLightbox();
    });
    lbPrev.addEventListener("click", function (event) {
      event.stopPropagation();
      if (activeCarousel) goTo(activeCarousel, currentIndex(activeCarousel) - 1);
    });
    lbNext.addEventListener("click", function (event) {
      event.stopPropagation();
      if (activeCarousel) goTo(activeCarousel, currentIndex(activeCarousel) + 1);
    });
    backdrop.addEventListener("click", function (event) {
      if (event.target === backdrop) closeLightbox();
    });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) event.stopPropagation();
    });
    document.addEventListener("keydown", function (event) {
      if (!backdrop.classList.contains("is-open")) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft" && activeCarousel) {
        goTo(activeCarousel, currentIndex(activeCarousel) - 1);
      }
      if (event.key === "ArrowRight" && activeCarousel) {
        goTo(activeCarousel, currentIndex(activeCarousel) + 1);
      }
    });
  })();
})();
