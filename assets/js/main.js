(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

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

  var revealLists = document.querySelectorAll(".project-showcase");
  var prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (revealLists.length) {
    var revealItems = [];
    revealLists.forEach(function (list) {
      list.classList.add("js-reveal");
      list.querySelectorAll(":scope > li").forEach(function (item) {
        revealItems.push(item);
      });
    });

    var reveal = function (item) {
      item.classList.add("in-view");
    };

    if (prefersReduce.matches || !("IntersectionObserver" in window)) {
      // No animation available/desired — show everything immediately.
      revealItems.forEach(reveal);
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              reveal(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0, rootMargin: "0px 0px -5% 0px" }
      );

      var viewportH = function () {
        return window.innerHeight || document.documentElement.clientHeight;
      };

      // Reveal anything already in or above the viewport on load immediately;
      // observe the rest so they slide in as they are scrolled into view.
      var revealIfInView = function (item) {
        if (item.classList.contains("in-view")) return true;
        if (item.getBoundingClientRect().top < viewportH()) {
          reveal(item);
          observer.unobserve(item);
          return true;
        }
        return false;
      };

      revealItems.forEach(function (item) {
        if (!revealIfInView(item)) {
          observer.observe(item);
        }
      });

      // Safety net so nothing can get stuck hidden if the observer misses an
      // item that is already visible on first paint.
      var safety = function () {
        revealItems.forEach(revealIfInView);
      };
      window.addEventListener("load", safety);
      window.setTimeout(safety, 1000);
    }
  }
})();
