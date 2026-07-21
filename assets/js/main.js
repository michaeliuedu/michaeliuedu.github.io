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

        root.classList.add("theme-transitioning");
        var transition = document.startViewTransition(function () {
          applyTheme(nextTheme);
        });

        var clearThemeClass = function () {
          root.classList.remove("theme-transitioning");
        };
        if (transition.finished && typeof transition.finished.then === "function") {
          transition.finished.then(clearThemeClass).catch(clearThemeClass);
        } else {
          window.setTimeout(clearThemeClass, 700);
        }

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
            clearThemeClass();
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

  var NAV_PENDING_KEY = "nav-pending-current";

  var navKeyFromUrl = function (url) {
    var file = (url.pathname.split("/").pop() || "").toLowerCase();
    if (file === "experiences.html" || file === "experiences") {
      return "experiences";
    }
    if (file === "education.html" || file === "education") {
      return "education";
    }
    if (!file || file === "index.html" || file === "index") {
      if ((url.hash || "").replace(/^#/, "") === "projects") return "projects";
      return "home";
    }
    return null;
  };

  var findNavLinkForKey = function (key) {
    if (!nav || !key) return null;
    var links = nav.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href") || "";
      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (err) {
        continue;
      }
      if (navKeyFromUrl(url) === key) return links[i];
    }
    return null;
  };

  var setNavCurrentKey = function (key, options) {
    if (!nav || !key) return;
    var opts = options || {};
    var link = findNavLinkForKey(key);
    if (!link) return;

    nav.querySelectorAll("a[aria-current]").forEach(function (item) {
      item.removeAttribute("aria-current");
    });
    link.setAttribute("aria-current", "page");

    if (opts.freeze) {
      nav.setAttribute("data-nav-freeze", "true");
    }

    document.dispatchEvent(
      new CustomEvent("nav:currentchange", {
        detail: { immediate: !!opts.immediate, key: key },
      })
    );
  };

  var applyPendingNavCurrent = function () {
    var pending = null;
    try {
      pending = sessionStorage.getItem(NAV_PENDING_KEY);
      sessionStorage.removeItem(NAV_PENDING_KEY);
    } catch (e) {}
    if (!pending) return false;
    setNavCurrentKey(pending, { immediate: true, freeze: false });
    return true;
  };

  (function initNavUnderline() {
    if (!nav) return;

    var indicator = document.createElement("span");
    indicator.className = "site-nav__indicator";
    indicator.setAttribute("aria-hidden", "true");
    nav.appendChild(indicator);

    var hoverLink = null;
    var placed = false;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var mobileQuery = window.matchMedia("(max-width: 768px)");

    var currentLink = function () {
      return nav.querySelector('a[aria-current="page"]');
    };

    var moveTo = function (link, immediate) {
      if (!link || mobileQuery.matches) {
        indicator.classList.remove("is-ready");
        return;
      }

      var navRect = nav.getBoundingClientRect();
      var linkRect = link.getBoundingClientRect();
      var left = linkRect.left - navRect.left;
      var top = linkRect.bottom - navRect.top - 1;
      var width = linkRect.width;

      if (immediate || reduceMotion.matches || !placed) {
        var prev = indicator.style.transition;
        indicator.style.transition = "none";
        indicator.style.width = width + "px";
        indicator.style.transform =
          "translate3d(" + left + "px, " + top + "px, 0)";
        void indicator.offsetWidth;
        indicator.style.transition = prev;
      } else {
        indicator.style.width = width + "px";
        indicator.style.transform =
          "translate3d(" + left + "px, " + top + "px, 0)";
      }

      if (placed) indicator.classList.add("is-ready");
    };

    var sync = function (immediate) {
      moveTo(hoverLink || currentLink(), immediate);
    };

    document.addEventListener("nav:currentchange", function (event) {
      if (event.detail && event.detail.key) {
        hoverLink = null;
        placed = true;
      }
      if (hoverLink) return;
      var immediate = event.detail && event.detail.immediate;
      sync(!!immediate);
    });

    nav.querySelectorAll("a[href]").forEach(function (link) {
      link.addEventListener("mouseenter", function () {
        if (mobileQuery.matches || nav.hasAttribute("data-nav-freeze")) return;
        hoverLink = link;
        sync(false);
      });
    });

    nav.addEventListener("mouseleave", function () {
      hoverLink = null;
      sync(false);
    });

    window.addEventListener(
      "resize",
      function () {
        sync(true);
      },
      { passive: true }
    );

    if (typeof ResizeObserver === "function") {
      var ro = new ResizeObserver(function () {
        sync(true);
      });
      ro.observe(nav);
    }

    /* Wait for header stack-in so link boxes are final, then place underline */
    var placeInitial = function () {
      if (placed) return;
      placed = true;
      sync(true);
    };

    var pendingLis = nav.querySelectorAll("li");
    var remaining = pendingLis.length;
    if (reduceMotion.matches || remaining === 0) {
      placeInitial();
    } else {
      pendingLis.forEach(function (li) {
        li.addEventListener(
          "animationend",
          function () {
            remaining -= 1;
            if (remaining <= 0) placeInitial();
          },
          { once: true }
        );
      });
      window.setTimeout(placeInitial, 900);
    }
  })();

  (function initHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    var ticking = false;
    var compactAfter = 40;
    var wasCompact = header.classList.contains("is-compact");

    var update = function () {
      var compact = window.scrollY > compactAfter;
      if (compact) {
        header.classList.add("is-compact");
      } else {
        header.classList.remove("is-compact");
      }
      if (compact !== wasCompact) {
        wasCompact = compact;
        document.dispatchEvent(
          new CustomEvent("nav:currentchange", {
            detail: { immediate: true },
          })
        );
      }
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  })();

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

    var hadPending = applyPendingNavCurrent();

    if (!entries.length) {
      if (!hadPending) {
        document.dispatchEvent(
          new CustomEvent("nav:currentchange", {
            detail: { immediate: true },
          })
        );
      }
      return;
    }

    entries.sort(function (a, b) {
      return a.el.offsetTop - b.el.offsetTop;
    });

    var lockId = null;
    var lockTimer = null;
    var activeId = null;

    var setActive = function (id) {
      if (nav.hasAttribute("data-nav-freeze")) return;
      if (id === activeId) return;

      activeId = id;
      navLinks.forEach(function (link) {
        link.removeAttribute("aria-current");
      });
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
          entries[i].link.setAttribute("aria-current", "page");
          break;
        }
      }

      document.dispatchEvent(
        new CustomEvent("nav:currentchange", {
          detail: { immediate: false },
        })
      );
    };

    var headerOffset = function () {
      var header = document.querySelector(".site-header");
      return header ? header.offsetHeight : 0;
    };

    var syncFromScroll = function () {
      if (lockId) return;
      if (nav.hasAttribute("data-nav-freeze")) return;

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
      if (nav.hasAttribute("data-nav-freeze")) return;
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

    if (hadPending) {
      var pendingLink = nav.querySelector('a[aria-current="page"]');
      if (pendingLink) {
        var pendingHref = pendingLink.getAttribute("href") || "";
        var pendingHash = pendingHref.indexOf("#");
        if (pendingHash !== -1) {
          lockActive(pendingHref.slice(pendingHash + 1));
        } else {
          document.dispatchEvent(
            new CustomEvent("nav:currentchange", {
              detail: { immediate: true },
            })
          );
        }
      }
    } else if (!activateFromHash(window.location.hash)) {
      syncFromScroll();
    }
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

  var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reveal = function (item) {
    item.classList.add("in-view");
  };

  var hide = function (item) {
    item.style.setProperty("--reveal-delay", "0s");
    item.classList.remove("in-view");
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

  var observeRevealItems = function (items, options) {
    var opts = options || {};
    var stagger = opts.stagger != null ? opts.stagger : 0.14;
    var startDelay = opts.startDelay != null ? opts.startDelay : 0.06;
    var threshold = opts.threshold != null ? opts.threshold : 0.12;
    var rootMargin = opts.rootMargin || "0px 0px -8% 0px";
    var once = !!opts.once;

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
            if (once) scrollObserver.unobserve(entry.target);
          } else if (!once) {
            hide(entry.target);
          }
        });
      },
      { threshold: threshold, rootMargin: rootMargin }
    );

    belowFoldItems.forEach(function (item) {
      scrollObserver.observe(item);
    });

    afterPaint(function () {
      visibleItems.forEach(function (item) {
        void item.offsetWidth;
      });

      visibleItems.forEach(function (item, index) {
        item.style.setProperty(
          "--reveal-delay",
          String(startDelay + index * stagger) + "s"
        );
        reveal(item);
      });

      if (once) return;

      var entranceMs = visibleItems.length * Math.round(stagger * 1000) + 700;
      window.setTimeout(function () {
        visibleItems.forEach(function (item) {
          scrollObserver.observe(item);
        });
      }, entranceMs);
    });
  };

  /* About + skills: enter with stagger, pull out on leave, replay on return */
  var observeReplayReveal = function (items, options) {
    var opts = options || {};
    var stagger = opts.stagger != null ? opts.stagger : 0.14;
    var startDelay = opts.startDelay != null ? opts.startDelay : 0.06;
    var threshold = opts.threshold != null ? opts.threshold : 0.12;
    var rootMargin = opts.rootMargin || "0px 0px -6% 0px";

    if (prefersReduce.matches || !("IntersectionObserver" in window)) {
      items.forEach(reveal);
      return;
    }

    var showItem = function (item, index, delayBase) {
      item.style.setProperty(
        "--reveal-delay",
        String(delayBase + index * stagger) + "s"
      );
      reveal(item);
    };

    var pendingShow = [];
    var flushScheduled = false;
    var initialPass = true;

    var flushShow = function () {
      flushScheduled = false;
      var batch = pendingShow.splice(0, pendingShow.length);
      if (!batch.length) return;

      batch.forEach(function (item) {
        void item.offsetWidth;
      });

      var delayBase = initialPass ? startDelay : 0;
      batch.forEach(function (item) {
        var index = items.indexOf(item);
        if (index < 0) index = 0;
        showItem(item, index, delayBase);
      });
      initialPass = false;
    };

    var scrollObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (entry.target.classList.contains("in-view")) return;
            pendingShow.push(entry.target);
            if (!flushScheduled) {
              flushScheduled = true;
              afterPaint(flushShow);
            }
          } else {
            hide(entry.target);
          }
        });
      },
      { threshold: threshold, rootMargin: rootMargin }
    );

    items.forEach(function (item) {
      scrollObserver.observe(item);
    });
  };

  var revealLists = document.querySelectorAll(
    ".project-showcase, .interest-list"
  );
  revealLists.forEach(function (list) {
    list.classList.add("js-reveal");
    observeRevealItems(
      Array.prototype.slice.call(list.querySelectorAll(":scope > li"))
    );
  });

  var aboutSection = document.getElementById("about");
  if (aboutSection) {
    aboutSection.classList.add("js-reveal");

    /* Foolproof About Me greeting: force hidden → paint → stagger play.
       Does not depend on keyframes, IntersectionObserver, or reduced-motion kills. */
    (function initAboutGreeting() {
      var title = aboutSection.querySelector(".section__title");
      var lines = Array.prototype.slice.call(
        aboutSection.querySelectorAll(".about-line")
      );
      var items = [];
      if (title) items.push(title);
      items = items.concat(lines);
      if (!items.length) return;

      items.forEach(function (el) {
        el.classList.remove("is-playing");
        el.classList.add("about-motion");
      });

      // Force layout so opacity:0 paints before we add is-playing
      void aboutSection.offsetWidth;

      afterPaint(function () {
        items.forEach(function (el, index) {
          var delayMs = 120 + index * 200;
          window.setTimeout(function () {
            el.classList.add("is-playing");
          }, delayMs);
        });
      });
    })();

    // Other section titles (Projects, News) — animate when scrolled into view
    // (moved below so Experience/Education pages also get title + underline draw)
    var skillList = aboutSection.querySelector(".skill-icons");
    if (skillList) {
      skillList.classList.add("js-reveal");

      if (prefersReduce.matches || !("IntersectionObserver" in window)) {
        skillList.classList.add("in-view");
      } else {
        var skillsUnlocked = false;
        var skillsIntersecting = false;
        var skillsSettled = false;

        var syncSkillsVisibility = function () {
          if (skillsUnlocked && skillsIntersecting) {
            skillList.classList.add("in-view");
            if (!skillsSettled) {
              skillList.classList.add("is-settling");
              skillsSettled = true;
              window.setTimeout(function () {
                skillList.classList.remove("is-settling");
                skillList.classList.add("has-settled");
              }, 1800);
            }
          } else {
            skillList.classList.remove("in-view");
          }
        };

        var skillObserver = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              skillsIntersecting = entry.isIntersecting;
              syncSkillsVisibility();
            });
          },
          { threshold: 0.15, rootMargin: "0px 0px -5% 0px" }
        );
        skillObserver.observe(skillList);

        var onScrollUnlock = function () {
          if (window.scrollY > 24) {
            skillsUnlocked = true;
            syncSkillsVisibility();
            window.removeEventListener("scroll", onScrollUnlock);
          }
        };
        window.addEventListener("scroll", onScrollUnlock, { passive: true });
      }
    }
  }

  (function initTitleUnderlineReveal() {
    var titles = Array.prototype.slice.call(
      document.querySelectorAll(
        ".content-wrap .section__title, .exp-group__title"
      )
    );
    if (!titles.length) return;

    titles.forEach(function (title) {
      if (title.closest("#about") && title.classList.contains("section__title")) {
        return;
      }
      title.classList.add("js-title-reveal");
      if (prefersReduce.matches || !("IntersectionObserver" in window)) {
        title.classList.add("is-entering");
        return;
      }
      var titleObs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              title.classList.add("is-entering");
            } else {
              title.classList.remove("is-entering");
              if (title.classList.contains("section__title")) {
                title.style.animation = "none";
                void title.offsetWidth;
                title.style.animation = "";
              }
            }
          });
        },
        { threshold: 0.25, rootMargin: "0px 0px -8% 0px" }
      );
      titleObs.observe(title);
    });
  })();

  (function initProjectCarousels() {
    var carousels = document.querySelectorAll("[data-carousel]");
    if (!carousels.length) return;

    var backdrop = document.createElement("div");
    backdrop.className = "image-lightbox";
    backdrop.setAttribute("hidden", "");
    var chevronPrev =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="15 6 9 12 15 18"></polyline></svg>';
    var chevronNext =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="9 6 15 12 9 18"></polyline></svg>';
    backdrop.innerHTML =
      '<button type="button" class="image-lightbox__nav image-lightbox__nav--prev" aria-label="Previous image">' +
      chevronPrev +
      "</button>" +
      '<button type="button" class="image-lightbox__nav image-lightbox__nav--next" aria-label="Next image">' +
      chevronNext +
      "</button>" +
      '<div class="image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Enlarged project image">' +
      '<button type="button" class="image-lightbox__close" aria-label="Close">&times;</button>' +
      '<img class="image-lightbox__img" alt="" />' +
      '<video class="image-lightbox__video" controls muted loop playsinline hidden></video>' +
      "</div>" +
      '<div class="image-lightbox__progress" role="tablist" aria-label="Carousel progress" hidden></div>';
    document.body.appendChild(backdrop);

    var dialog = backdrop.querySelector(".image-lightbox__dialog");
    var lbImg = backdrop.querySelector(".image-lightbox__img");
    var lbVideo = backdrop.querySelector(".image-lightbox__video");
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
      lbVideo.pause();
      lbVideo.removeAttribute("src");
      lbVideo.load();
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
      if (active.tagName === "VIDEO") {
        lbImg.hidden = true;
        lbVideo.hidden = false;
        lbVideo.src =
          active.currentSrc ||
          active.src ||
          (active.querySelector("source") && active.querySelector("source").src);
        lbVideo.poster = active.poster || "";
        lbVideo.currentTime = 0;
        var playPromise = lbVideo.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
      } else {
        lbVideo.pause();
        lbVideo.hidden = true;
        lbImg.hidden = false;
        lbImg.src = active.currentSrc || active.src;
        lbImg.alt = active.alt || "Project image";
      }
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
        var isActive = i === next;
        slide.classList.toggle("is-active", isActive);
        var video = slide.querySelector("video");
        if (video) {
          if (isActive) {
            video.currentTime = 0;
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
              playPromise.catch(function () {});
            }
          } else {
            video.pause();
          }
        }
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
          if (
            event.target.closest(
              ".project-carousel__btn, .project-carousel__dot"
            )
          ) {
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

      goTo(carousel, currentIndex(carousel));
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

  /* Mild scroll-linked shift on the hero headshot — Apple-soft, not heavy parallax */
  (function initHeroParallax() {
    var photo = document.querySelector(".hero__photo");
    if (!photo || prefersReduce.matches) return;

    var avatar = photo.querySelector(".avatar");
    if (!avatar) return;

    var ticking = false;
    var maxShift = 14;

    function update() {
      ticking = false;
      var rect = photo.getBoundingClientRect();
      var viewH = viewportH();
      if (rect.bottom < 0 || rect.top > viewH) {
        avatar.style.setProperty("--parallax-y", "0px");
        return;
      }
      /* Progress through the upper viewport: 0 at top, ~1 as photo leaves */
      var progress = Math.min(1, Math.max(0, -rect.top / (viewH * 0.65)));
      var shift = progress * maxShift;
      avatar.style.setProperty("--parallax-y", shift.toFixed(2) + "px");
    }

    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    update();
  })();

  /* News timeline — dots react as items enter view */
  (function initNewsTimeline() {
    var timeline = document.querySelector(".news-timeline");
    var items = document.querySelectorAll(".news-timeline__item");
    if (!timeline || !items.length) return;

    var syncRail = function () {
      var any = false;
      for (var i = 0; i < items.length; i++) {
        if (items[i].classList.contains("is-active")) {
          any = true;
          break;
        }
      }
      timeline.classList.toggle("has-active", any);
    };

    if (prefersReduce.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-active");
      });
      syncRail();
      return;
    }

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-active");
          } else {
            entry.target.classList.remove("is-active");
          }
        });
        syncRail();
      },
      { threshold: 0.45, rootMargin: "0px 0px -10% 0px" }
    );

    items.forEach(function (item) {
      obs.observe(item);
    });
  })();

  /* 6. Directional crimson page wipe — Home → Experience → Education */
  (function initPageTransitions() {
    var WIPE_KEY = "page-wipe-dir";
    var WIPE_MS = 420;
    var navigating = false;

    var pageIndexFromPath = function (pathname) {
      var file = (pathname.split("/").pop() || "").toLowerCase();
      if (!file || file === "index.html" || file === "index") return 0;
      if (file === "experiences.html" || file === "experiences") return 1;
      if (file === "education.html" || file === "education") return 2;
      return -1;
    };

    var wipeDirection = function (fromIndex, toIndex) {
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return null;
      return toIndex > fromIndex ? "forward" : "back";
    };

    var clearWipePending = function () {
      document.documentElement.classList.remove(
        "page-wipe-pending",
        "page-wipe-forward",
        "page-wipe-back"
      );
    };

    var createWipe = function (direction, phase) {
      var overlay = document.createElement("div");
      overlay.className =
        "page-wipe page-wipe--" + direction + " page-wipe--" + phase;
      overlay.setAttribute("aria-hidden", "true");
      return overlay;
    };

    var runWipe = function (overlay, options) {
      var opts = options || {};
      var keep = !!opts.keep;
      var onDone = opts.onDone;

      if (!overlay.parentNode) document.body.appendChild(overlay);

      var finished = false;
      var finish = function () {
        if (finished) return;
        finished = true;
        if (!keep && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (typeof onDone === "function") onDone();
      };

      overlay.addEventListener("transitionend", function (event) {
        if (event.target !== overlay) return;
        if (
          event.propertyName &&
          event.propertyName !== "transform" &&
          event.propertyName !== "opacity"
        ) {
          return;
        }
        finish();
      });

      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          overlay.classList.add("is-animating", "is-active");
        });
      });

      window.setTimeout(finish, WIPE_MS + 80);
    };

    var resolveNavTarget = function (anchor) {
      if (!anchor || anchor.target === "_blank") return null;
      var href = anchor.getAttribute("href");
      if (!href || href.charAt(0) === "#" || href.indexOf("mailto:") === 0) {
        return null;
      }
      var url;
      try {
        url = new URL(href, window.location.href);
      } catch (err) {
        return null;
      }
      if (url.origin !== window.location.origin) return null;

      var toIndex = pageIndexFromPath(url.pathname);
      if (toIndex < 0) return null;

      var fromIndex = pageIndexFromPath(window.location.pathname);
      if (fromIndex < 0) return null;
      if (fromIndex === toIndex) return null;

      var direction = wipeDirection(fromIndex, toIndex);
      if (!direction) return null;

      return { href: url.href, direction: direction };
    };

    /* Entering page: crimson already covering via html.page-wipe-pending — wipe out */
    (function playEnterWipe() {
      var direction = null;
      try {
        direction = sessionStorage.getItem(WIPE_KEY);
        sessionStorage.removeItem(WIPE_KEY);
      } catch (e) {}

      if (direction !== "forward" && direction !== "back") {
        clearWipePending();
        return;
      }

      if (prefersReduce.matches) {
        clearWipePending();
        return;
      }

      var overlay = createWipe(direction, "out");
      document.body.appendChild(overlay);
      clearWipePending();
      runWipe(overlay, { keep: false });
    })();

    document.addEventListener("click", function (event) {
      if (navigating || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      var anchor = event.target.closest && event.target.closest("a[href]");
      var target = resolveNavTarget(anchor);
      if (!target) return;

      event.preventDefault();
      navigating = true;

      var destUrl;
      try {
        destUrl = new URL(target.href);
      } catch (err) {
        destUrl = null;
      }
      var navKey = destUrl ? navKeyFromUrl(destUrl) : null;
      if (navKey) {
        try {
          sessionStorage.setItem(NAV_PENDING_KEY, navKey);
        } catch (e) {}
        setNavCurrentKey(navKey, { freeze: true, immediate: false });
      }

      if (prefersReduce.matches) {
        window.location.href = target.href;
        return;
      }

      try {
        sessionStorage.setItem(WIPE_KEY, target.direction);
      } catch (e) {}

      var overlay = createWipe(target.direction, "in");
      runWipe(overlay, {
        keep: true,
        onDone: function () {
          window.location.href = target.href;
        },
      });
    });
  })();

  /* 9. Footer fade-in when near viewport */
  (function initFooterReveal() {
    var footer = document.querySelector(".site-footer");
    if (!footer) return;

    footer.classList.add("js-footer-reveal");

    if (prefersReduce.matches || !("IntersectionObserver" in window)) {
      footer.classList.add("is-visible");
      return;
    }

    var obs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            footer.classList.add("is-visible");
            obs.unobserve(footer);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -4% 0px" }
    );
    obs.observe(footer);
  })();
})();
