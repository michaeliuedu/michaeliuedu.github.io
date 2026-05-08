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
})();
