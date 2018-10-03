// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

var ToolModel = require('tools/tool');
// var SuggestView = require('components/Suggest');

/**
 * @typedef {Object} SearchModel~SearchModelProperties
 * @property {string} type - Default: search
 * @property {string} panel - Default: searchpanel
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-search icon
 * @property {string} title - Default: Sök i kartan
 * @property {string} visible - Default: false
 * @property {string} headerText - Default: 'Information om kartan.'
 * @property {string} text - Default: false
 */
var SuggestModelProperties = {
  type: 'suggest',
  panel: '',
  toolbar: 'bottom',
  icon: 'fa fa-comments icon',
  title: 'Lämna synpunkter title',
  display: false,
  headerText: 'Lämna synpunkter headerText',
  text: 'Lämna synpunkter text'
};

/**
 * Prototype for creating a search model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {SearchModel~SuggestModelProperties} options - Default options
 */
var SuggestModel = {
  /**
   * @instance
   * @property {SearchModel~SuggestModelProperties} defaults - Default settings
   */
  defaults: SuggestModelProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

  configure: function (shell) {
    this.set('shell', shell);
  },
  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   which in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */

  detectBrowser: function () {
    // Opera 8.0+
    var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;

    // Firefox 1.0+
    var isFirefox = typeof InstallTrigger !== 'undefined';

    // Safari 3.0+ "[object HTMLElementConstructor]" 
    var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && safari.pushNotification));

    // Internet Explorer 6-11
    var isIE = /*@cc_on!@*/false || !!document.documentMode;

    // Edge 20+
    var isEdge = !isIE && !!window.StyleMedia;

    // Chrome 1+
    var isChrome = !!window.chrome && !!window.chrome.webstore;

    // Blink engine detection
    var isBlink = (isChrome || isOpera) && !!window.CSS;

    let browsers = {
      isOpera: isOpera,
      isFirefox: isFirefox,
      isSafari: isSafari,
      isIE: isIE,
      isEdge: isEdge,
      isChrome: isChrome,
      isBlink: isBlink
    };

    // Return an array that only contains keys where value===true
    return Object.keys(browsers).filter((k,v) => {
      if (browsers[k] === true) {
        console.log('will keep', k);
        return true;
      } else return false;
    });
  },

  getActiveLayers: function () {
    // TODO
  },

  clicked: function () {
    let browser = this.detectBrowser();
    let url = window.location.href;
    let activeLayers = this.getActiveLayers();

    let response = {
      browser,
      url,
      activeLayers
    };
    console.log(response);

    let email = "some.mail@somewhere.com";
    let string = `mailto:${email}?subject=HAJK2%20tips&body=write%20message%20above%20this%20string:%20${JSON.stringify(
      response
    )}`;
    window.alert('Din mailapplikation kommer att öppnas. Där kan du skriva dina synpunkter, önskemål, mm. Låt de förifyllda värden (adress, felsökningsinformation) vara kvar, så kommer vi kunna hantera ditt ärende lättare.');
    window.location.href = string;
  }
};

/**
 * Search model module.<br>
 * Use <code>require('models/search')</code> for instantiation.
 * @module SearchModel-module
 * @returns {SuggestModel}
 */
module.exports = ToolModel.extend(SuggestModel);
