/*global FastBoot:true*/
import Ember from 'ember';

const {
  computed,
  Service,
  typeOf,
  Evented,
  run: { next }
} = Ember;

const WINDOW_PROPERTIES = [
  'innerHeight',
  'innerWidth',
  'outerHeight',
  'outerWidth',
  'screenX',
  'screenY'
];

const PROPERTIES_TO_CHANGE_ON_INTERVAL = [
  'screenX',
  'screenY',
  'scrollLeft',
  'scrollTop'
];

const PROPERTIES_TO_CHANGE_ON_WINDOW_RESIZE = [
  'innerWidth',
  'innerHeight',
  'outerWidth',
  'outerHeight',
  'scrollHeight',
  'scrollWidth',
  'scrollLeft',
  'scrollTop',
  'clientWidth',
  'clientHeight',
  'screenY',
  'screenX'
];

const FAKE_WINDOW = {
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame() {},
  cancelAnimationFrame() {}
};

const serviceCfg = {
  w: typeof FastBoot === 'undefined' ? window : FAKE_WINDOW,

  init() {
    this._super(...arguments);
    this.get('w').addEventListener('resize', this._onWindowResize.bind(this));
    this._refreshPollLoop();
  },

  willDestroy() {
    this.get('w').cancelAnimationFrame(this._rpid);
    this.get('w').removeEventListener('resize', this._onWindowResize);
  },

  _onWindowResize(evt) {
    PROPERTIES_TO_CHANGE_ON_WINDOW_RESIZE.forEach((prop) => {
      next(() => {
        this.notifyPropertyChange(prop);
        this.trigger('resize', evt);
      });
    });
  },

  _refreshPollLoop() {
    PROPERTIES_TO_CHANGE_ON_INTERVAL.forEach((p) => {
      next(() => this.notifyPropertyChange(p));
    });
    this._rpid = this.get('w').requestAnimationFrame(() => this._refreshPollLoop());
  },

  clientHeight: computed(function() {
    return this.get('w.document.documentElement.clientHeight') || 0;
  }).volatile(),
  clientWidth: computed(function() {
    return this.get('w.document.documentElement.clientWidth') || 0;
  }).volatile(),
  scrollTop: computed(function() {
    return this.get('w.document.documentElement.scrollTop') ||
      this.get('w.document.body.scrollTop') || 0;
  }).volatile(),
  scrollLeft: computed(function() {
    return this.get('w.document.documentElement.scrollLeft') ||
      this.get('w.document.body.scrollLeft') || 0;
  }).volatile(),
  scrollHeight: computed(function() {
    return this.get('w.document.documentElement.scrollHeight') ||
      this.get('w.document.body.scrollHeight') || 0;
  }).volatile(),
  scrollWidth: computed(function() {
    return this.get('w.document.documentElement.scrollWidth') ||
      this.get('w.document.body.scrollWidth') || 0;
  }).volatile(),

  scrollRight: computed('scrollLeft', 'scrollWidth', 'clientWidth', function() {
    return (this.get('scrollWidth') - this.get('clientWidth')) - this.get('scrollLeft');
  }),

  scrollBottom: computed('scrollTop', 'scrollHeight', 'clientHeight', function() {
    return (this.get('scrollHeight') - this.get('clientHeight')) - this.get('scrollTop');
  }),

  scrollHRatio: computed('scrollLeft', 'scrollWidth', 'clientWidth', function() {
    if (this.get('scrollWidth') === this.get('clientWidth')) {
      return 1;
    } else {
      return this.get('scrollLeft') / (this.get('scrollWidth') - this.get('clientWidth'));
    }
  }),
  scrollVRatio: computed('scrollTop', 'scrollHeight', 'clientHeight', function() {
    return this.get('scrollTop') / (this.get('scrollHeight') - this.get('clientHeight'));
  })
};

WINDOW_PROPERTIES.forEach(function(propInfo) {
  switch (typeOf(propInfo)) {
    case 'string':
      serviceCfg[propInfo] = computed(function() {
        return this.get(`w.${propInfo}`) || 0;
      });
      break;
    default:
      throw `Invalid property value: ${propInfo} of type ${typeOf(propInfo)}`;
  }
});

export default Service.extend(Evented, serviceCfg);
