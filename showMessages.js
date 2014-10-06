define(['jquery'], function($) {
  'use strict';

  function showMessages($form, messages, options) {
    options = $.extend({
      fade: true,
      floating: false,
      prepend: false
    }, options);

    var $container = $form.find('.messages'),
        msgs       = [];

    if (!$container.length) {
      $container = $('<div class="messages"></div>').hide().addClass(options.classes || '');

      if (options.floating) {
        $container.addClass('messages-floating');
      }

      if (options.prepend) {
        $container.prependTo($form);
      }
      else {
        $container.appendTo($form);
      }
    }

    messages.forEach(function(msg) {
      msg.type = msg.type || 'message';

      var msg_str;

      switch (msg.type) {
        case 'error' :
        case 'message' :
        case 'success' :
          break;

        default :
          throw ('"' + msg.type + '" is not a valid message type');
      }

      if (msg.fade === false) {
        options.fade = false;
      }

      msg_str = '<div class="' + msg.type + '">' +
                '<span class="icon-status-' + msg.type + ' icon sprite-site-elements"></span>' +
                msg.message +
                '</div>';

      msgs.push(msg_str);
    });

    $container.html(msgs.join('')).show();

    if (options.fade) {
      $container.delay(5000).fadeOut(1000);
    }
  }

  return showMessages;
});
