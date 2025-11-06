import tracer from 'dd-trace';
import StatsD from 'hot-shots';

// Initialize Datadog APM tracer
// This must be imported and initialized BEFORE any other modules
export const initializeDatadog = () => {
  if (process.env.DD_API_KEY) {
    tracer.init({
      logInjection: true,
      analytics: true,
      runtimeMetrics: true,
    });
    console.log('✅ Datadog APM initialized');
  } else {
    console.warn('⚠️  DD_API_KEY not set - Datadog APM disabled');
  }
};

// StatsD client for custom metrics
export const metrics = new StatsD({
  host: 'localhost', // dd-trace agent
  port: 8125,
  prefix: 'gorillabooks.',
  globalTags: {
    env: process.env.DD_ENV || process.env.NODE_ENV || 'development',
    service: process.env.DD_SERVICE || 'gorillabooks',
  },
});

// Helper to send Datadog events
export const sendDatadogEvent = async (
  title: string,
  text: string,
  alertType: 'error' | 'warning' | 'info' | 'success' = 'info',
  tags: string[] = []
): Promise<void> => {
  if (!process.env.DD_API_KEY) {
    console.warn('DD_API_KEY not set - skipping Datadog event');
    return;
  }

  try {
    const event = {
      title,
      text,
      alert_type: alertType,
      tags: [
        `env:${process.env.DD_ENV || process.env.NODE_ENV || 'development'}`,
        `service:${process.env.DD_SERVICE || 'gorillabooks'}`,
        ...tags,
      ],
    };

    // Use Datadog HTTP API to send event
    const response = await fetch('https://api.datadoghq.com/api/v1/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': process.env.DD_API_KEY,
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      console.error('Failed to send Datadog event:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Datadog event:', error);
  }
};
