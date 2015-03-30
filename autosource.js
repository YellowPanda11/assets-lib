define(['jquery', 'nbd/Class'], function($, Class) {
  'use strict';

  var
  // Helper methods
  push = Array.prototype.push,
  addRemote = function() {
    push.apply(this._remotes, arguments);
    return this.source;
  },
  addLocal = function() {
    push.apply(this._local, arguments);
    return this.source;
  },
  merge = function() {
    return Array.prototype.concat.apply([], arguments);
  },
  mergeLocal = function(search, arr) {
    return this.filter([], search).concat(arr);
  },

  AutoSource = Class.extend({
    /**
     * a serialized version of values that will be automatically filtered from results
     *
     * @type {String}
     */
    _blacklist: '',

    options: {
      maxLocal: Infinity,
      caseInsensitive: false,
      minLength: 1
    },

    init: function(options) {
      this._remotes = [];
      this._local = [];

      this.setOptions(options);

      // These methods are extended onto source to ensure chainability
      this.source = $.extend(this.source.bind(this), {
        addRemote: addRemote.bind(this),
        addLocal: addLocal.bind(this)
      });
    },

    /**
     * sets options
     *
     * @param {Object} options key value pairs of options
     */
    setOptions: function(options) {
      $.extend(this.options, options);
    },

    /**
     * returns a deferred object from the added remotes
     * The context of this function is the search object.
     *
     * @param {String|Function} value A remote added by addRemote()
     * @see filter
     */
    callRemote: function(value) {
      if ($.isFunction(value)) {
        return value(this);
      }
      return value;
    },

    /**
     * returns objects to be merged into a single array
     * for the filter function to run on.
     *
     * @param {Function|Object} value Either the literal data object or a function that returns it
     */
    callLocal: function(value) {
      if ($.isFunction(value)) {
        return value(this);
      }
      return value;
    },

    /**
     * Searches for substring match with search.term as the needle
     * and _local item values as hay.
     *
     * @param {Object} search Object with term as the string to match
     * @memoizes
     */
    filter: function filter(cache, search) {
      this._filterMemo = this._filterMemo || {};

      var i, value,
      results = [],
      maxLength = this.options.maxLocal || Infinity,

      term = search.term;
      if (this.options.caseInsensitive) {
        term = term.toLocaleLowerCase();
      }

      if (this._filterMemo[term]) { return this._filterMemo[term]; }

      for (i = 0; i < cache.length && results.length < maxLength; ++i) {
        value = cache[i].value;

        if (this.options.caseInsensitive) {
          value = value.toLocaleLowerCase();
        }

        if (value.indexOf(term) >= 0) {
          results.push(cache[i]);
        }
      }

      return (this._filterMemo[term] = results);
    },

    /**
     * function meant to be handed to an autocomplete/autosuggest
     *
     * @param {Object} search contains search term from jQuery autocomplete
     * @param {Function} callback the function to call with results formatted results
     */
    source: function(search, callback) {
      if (search.term.length < this.options.minLength) { return; }

      // Run the local search first
      var local = this._local.length ?
        this.filter(merge.apply(null, this._local.map(this.callLocal, search)), search) :
        [];

      if (this._remotes.length) {
        if (local.length) { callback(local); }

        // Run the remote searches
        $.when.apply($, this._remotes.map(this.callRemote, search))
        .then(merge)
        .then(mergeLocal.bind(this, search))
        .then(callback);
      }
      else {
        callback(local);
      }
    },

    /**
     * sets blacklist
     *
     * @param {String} blacklist serialized version of the blacklist
     */
    setBlacklist: function(blacklist) {
      this._blacklist = blacklist;
    }
  });

  function autosource(config) {
    var Source = new AutoSource(config);
    return Source.source;
  }

  autosource.constructor = AutoSource;

  /**
   * static init function provided to maintain api compatibility with
   * be.net/inbox/lib/composeSource during transition
   *
   * @param {Object} config a set of configuration options
   * @todo remove this once everything is using the actual constructor
   */
  autosource.init = function(config) {
    return new AutoSource(config);
  };

  return autosource;
});
