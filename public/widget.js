/**
 * TripNav AI Travel Planner Widget SDK
 * Version: 1.0.0
 * 
 * This SDK allows operators to embed AI-powered travel planning widgets on their websites.
 */

(function(window, document) {
  'use strict';

  // Global namespace
  window.TripNavWidget = window.TripNavWidget || {};

  // Widget configuration
  const config = {
    apiUrl: 'https://app.tripnav.ai/api',
    version: '1.0.0',
    defaultTheme: {
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: 'md',
      buttonStyle: 'solid'
    }
  };

  // Widget types and their configurations
  const widgetTypes = {
    itinerary_builder: {
      title: 'Plan Your Perfect Trip',
      features: ['natural_language_input', 'ai_suggestions', 'date_picker']
    },
    tour_showcase: {
      title: 'Explore Our Tours',
      features: ['tour_grid', 'filters', 'quick_booking']
    },
    lead_capture: {
      title: 'Get Personalized Travel Recommendations',
      features: ['form_builder', 'ai_insights']
    },
    booking_calendar: {
      title: 'Book Your Adventure',
      features: ['calendar_view', 'availability', 'instant_booking']
    }
  };

  // Main widget class
  class TripNavWidget {
    constructor(options) {
      this.options = Object.assign({}, config.defaultTheme, options);
      this.container = null;
      this.iframe = null;
      this.initialized = false;
      this.messageHandlers = new Map();
      
      // Validate API key
      if (!this.options.apiKey) {
        throw new Error('TripNav Widget: API key is required');
      }
      
      // Validate container
      if (!this.options.containerId) {
        throw new Error('TripNav Widget: Container ID is required');
      }
      
      this.init();
    }

    init() {
      // Find container
      this.container = document.getElementById(this.options.containerId);
      if (!this.container) {
        console.error(`TripNav Widget: Container with ID "${this.options.containerId}" not found`);
        return;
      }

      // Apply container styles
      this.container.style.position = 'relative';
      this.container.style.width = '100%';
      this.container.style.minHeight = this.getMinHeight();

      // Create loading state
      this.showLoading();

      // Verify API key and fetch widget configuration
      this.verifyAndLoad();
    }

    async verifyAndLoad() {
      try {
        // Verify API key and get widget configuration
        const response = await fetch(`${config.apiUrl}/widgets/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-API-Key': this.options.apiKey
          },
          body: JSON.stringify({
            domain: window.location.hostname
          })
        });

        if (!response.ok) {
          throw new Error('Invalid API key or domain not authorized');
        }

        const data = await response.json();
        
        // Merge server configuration with local options
        this.widgetConfig = Object.assign({}, data.widget, this.options);
        
        // Create iframe
        this.createIframe();
        
        // Set up message handling
        this.setupMessageHandling();
        
        // Track widget load
        this.trackEvent('widget_load');
        
      } catch (error) {
        console.error('TripNav Widget Error:', error);
        this.showError(error.message);
      }
    }

    createIframe() {
      // Remove loading state
      this.container.innerHTML = '';

      // Create iframe
      this.iframe = document.createElement('iframe');
      this.iframe.src = this.buildIframeUrl();
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.iframe.style.border = 'none';
      this.iframe.style.minHeight = this.getMinHeight();
      this.iframe.setAttribute('title', widgetTypes[this.options.type]?.title || 'TripNav Widget');
      this.iframe.setAttribute('allow', 'microphone'); // For voice input

      // Handle iframe load
      this.iframe.onload = () => {
        this.initialized = true;
        this.sendConfiguration();
      };

      this.container.appendChild(this.iframe);
    }

    buildIframeUrl() {
      const params = new URLSearchParams({
        apiKey: this.options.apiKey,
        type: this.options.type || 'itinerary_builder',
        origin: window.location.origin
      });

      return `${config.apiUrl.replace('/api', '')}/widget?${params.toString()}`;
    }

    sendConfiguration() {
      if (!this.iframe || !this.initialized) return;

      this.postMessage({
        type: 'WIDGET_CONFIG',
        config: {
          theme: this.widgetConfig.theme,
          features: this.widgetConfig.features,
          settings: this.widgetConfig.settings,
          type: this.widgetConfig.type
        }
      });
    }

    setupMessageHandling() {
      window.addEventListener('message', (event) => {
        // Verify origin
        if (!event.origin.startsWith(config.apiUrl.replace('/api', ''))) {
          return;
        }

        const { type, data } = event.data;

        switch (type) {
          case 'WIDGET_READY':
            this.handleWidgetReady();
            break;
          case 'WIDGET_RESIZE':
            this.handleResize(data);
            break;
          case 'WIDGET_EVENT':
            this.handleWidgetEvent(data);
            break;
          case 'LEAD_CAPTURED':
            this.handleLeadCaptured(data);
            break;
          case 'BOOKING_CREATED':
            this.handleBookingCreated(data);
            break;
          case 'ITINERARY_GENERATED':
            this.handleItineraryGenerated(data);
            break;
          default:
            // Custom event handlers
            if (this.messageHandlers.has(type)) {
              this.messageHandlers.get(type)(data);
            }
        }
      });
    }

    handleWidgetReady() {
      this.container.classList.add('tripnav-widget-ready');
      this.trackEvent('widget_ready');
      
      // Notify parent application
      if (this.options.onReady) {
        this.options.onReady();
      }
    }

    handleResize(data) {
      if (data.height) {
        this.iframe.style.height = `${data.height}px`;
      }
    }

    handleWidgetEvent(data) {
      this.trackEvent(data.eventName, data.eventData);
      
      // Call custom event handler if provided
      if (this.options.onEvent) {
        this.options.onEvent(data.eventName, data.eventData);
      }
    }

    handleLeadCaptured(data) {
      this.trackEvent('lead_captured', data);
      
      if (this.options.onLeadCaptured) {
        this.options.onLeadCaptured(data);
      }
    }

    handleBookingCreated(data) {
      this.trackEvent('booking_created', data);
      
      if (this.options.onBookingCreated) {
        this.options.onBookingCreated(data);
      }
    }

    handleItineraryGenerated(data) {
      this.trackEvent('itinerary_generated', data);
      
      if (this.options.onItineraryGenerated) {
        this.options.onItineraryGenerated(data);
      }
    }

    postMessage(message) {
      if (this.iframe && this.iframe.contentWindow) {
        this.iframe.contentWindow.postMessage(message, '*');
      }
    }

    // Public API methods
    on(eventType, handler) {
      this.messageHandlers.set(eventType, handler);
    }

    off(eventType) {
      this.messageHandlers.delete(eventType);
    }

    updateTheme(theme) {
      this.postMessage({
        type: 'UPDATE_THEME',
        theme: theme
      });
    }

    setLanguage(language) {
      this.postMessage({
        type: 'SET_LANGUAGE',
        language: language
      });
    }

    reset() {
      this.postMessage({
        type: 'RESET_WIDGET'
      });
    }

    destroy() {
      if (this.iframe) {
        this.iframe.remove();
      }
      this.container.innerHTML = '';
      this.initialized = false;
    }

    // Helper methods
    getMinHeight() {
      const heights = {
        itinerary_builder: '600px',
        tour_showcase: '500px',
        lead_capture: '400px',
        booking_calendar: '550px'
      };
      return heights[this.options.type] || '500px';
    }

    showLoading() {
      this.container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: ${this.getMinHeight()};
          font-family: ${this.options.fontFamily || config.defaultTheme.fontFamily};
          color: #6B7280;
        ">
          <div style="text-align: center;">
            <div style="
              width: 40px;
              height: 40px;
              border: 3px solid #E5E7EB;
              border-top-color: ${this.options.primaryColor || config.defaultTheme.primaryColor};
              border-radius: 50%;
              animation: tripnav-spin 1s linear infinite;
              margin: 0 auto 16px;
            "></div>
            <div>Loading travel planner...</div>
          </div>
        </div>
        <style>
          @keyframes tripnav-spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
    }

    showError(message) {
      this.container.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: ${this.getMinHeight()};
          font-family: ${this.options.fontFamily || config.defaultTheme.fontFamily};
          color: #EF4444;
          padding: 20px;
          text-align: center;
        ">
          <div>
            <svg style="width: 48px; height: 48px; margin: 0 auto 16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div style="font-weight: 600; margin-bottom: 8px;">Widget Error</div>
            <div style="color: #6B7280; font-size: 14px;">${message}</div>
          </div>
        </div>
      `;
    }

    trackEvent(eventName, eventData = {}) {
      // Send analytics event
      if (this.options.apiKey) {
        fetch(`${config.apiUrl}/widgets/analytics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Widget-API-Key': this.options.apiKey
          },
          body: JSON.stringify({
            eventName,
            eventData,
            widgetId: this.widgetConfig?.id,
            domain: window.location.hostname,
            page: window.location.pathname,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
          })
        }).catch(err => console.error('Analytics error:', err));
      }
    }
  }

  // Public API
  window.TripNavWidget = {
    version: config.version,
    
    init: function(options) {
      return new TripNavWidget(options);
    },

    // Helper to create multiple widgets
    createMultiple: function(configs) {
      return configs.map(config => new TripNavWidget(config));
    },

    // Utility functions
    utils: {
      loadCSS: function(url) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        document.head.appendChild(link);
      },

      ready: function(fn) {
        if (document.readyState !== 'loading') {
          fn();
        } else {
          document.addEventListener('DOMContentLoaded', fn);
        }
      }
    }
  };

})(window, document);