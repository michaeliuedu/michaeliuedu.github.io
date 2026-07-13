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
