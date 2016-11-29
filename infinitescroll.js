define([
  'jquery',
  'log'
], function($, log) {
  'use strict';

  var $window = $(window),
      $document = $(document),
      scrollCache = {},
      registry = {};

  function callIt(fn) { fn(); }

  // Check if the user's viewport has scrolled based a defined breakpoint
  function scrolled($context) {
    var elementHeight, scrollBottom;

    if ($context.is($window)) {
      elementHeight = (window.innerHeight || $window.height());
      scrollBottom = $document.height() - elementHeight - $window.scrollTop();
    }
    else {
      elementHeight = $context.prop('clientHeight');
      scrollBottom = $context.prop('scrollHeight') - elementHeight - $context.scrollTop();
    }

    return (scrollBottom / elementHeight);
  }

  function scroll(context) {
    var $context = context === 'window' ? $window : $(context);
    var scrollEls = 'window' === context ? $('html,body') : $context;

    return function() {
      var canScroll = scrollEls.toArray().every(function(el) {
        return $(el).css('overflowY') !== 'hidden';
      });

      var breakpoint, s = scrolled($context);

      for (breakpoint in registry[context]) {
        if (s <= Number(breakpoint) && canScroll) {
          registry[context][breakpoint].wrapped.forEach(callIt);
        }
      }
    };
  }

  function infinitescroll(breakpoint, callback, context) {
    if (typeof breakpoint === "function") {
      context = callback;
      callback = breakpoint;
      breakpoint = 1;
    }
    context = context || 'window';
    breakpoint = Number(breakpoint).toString();

    var cb, $context = context === 'window' ? $window : $(context);

    if (!registry[context]) {
      registry[context] = {};
      scrollCache[context] = scroll(context);

      $context.on('scroll', scrollCache[context]);
    }

    cb = registry[context][breakpoint];

    if (!cb) {
      cb = registry[context][breakpoint] = {
        wrapped: [],
        original: []
      };
    }

    function onHit() {
      if (onHit.blocking) { return; }
      onHit.blocking = true;

      var retval = callback.apply(null, arguments);

      if (retval && typeof retval.then === 'function') {
        retval.then(function() {
          onHit.blocking = false;
          scrollCache[context]();
        }, function(err) {
          if (err instanceof Error) {
            log.warn(err);
          }
        });
      }
      else {
        onHit.blocking = false;
      }
    }

    // store both the original and wrapped so it can be removed
    cb.original.push(callback);
    cb.wrapped.push(onHit);

    // First check
    scrollCache[context]();
  }

  infinitescroll.remove = function(fn, context) {
    context = context || 'window';

    var breakpoint, cb, i,
        $context = context === 'window' ? $window : $(context);

    for (breakpoint in registry[context]) {
      cb = registry[context][breakpoint];
      // search for the original function
      i = cb.original.indexOf(fn);
      if (~i) {
        cb.original.splice(i, 1);
        cb.wrapped.splice(i, 1);
        if (!cb.original.length) {
          delete registry[context][breakpoint];
        }
      }
    }

    if (!Object.keys(registry[context]).length) {
      $context.off('scroll', scrollCache[context]);
      delete registry[context];
    }
  };

  infinitescroll.check = function(context) {
    context = context || 'window';

    scrollCache[context]();
  };

  return infinitescroll;
});
