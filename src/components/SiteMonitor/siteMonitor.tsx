import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SiteMonitorProps, HealthStatus } from '@/types/common';
import { addWidgetRemovalListener } from '../../utils/widgetEvents';
import styles from './siteMonitor.module.css';
import widgetCommon from '../../styles/widgetCommon.module.css';

const determineStatus = (responseOk: boolean, responseText: string): HealthStatus => {
  if (!responseOk) return 'unhealthy';

  try {
    const data = JSON.parse(responseText) as Record<string, unknown>;
    if (data && typeof data.status === 'string') {
      const normalized = data.status.toLowerCase();
      if (normalized === 'healthy') return 'healthy';
      if (normalized === 'degraded') return 'degraded';
      return 'unhealthy';
    }
  } catch {
    // Not valid JSON — fall through to text search
  }

  const lowerText = responseText.toLowerCase();
  if (lowerText.includes('healthy')) return 'healthy';
  if (lowerText.includes('degraded')) return 'degraded';

  return 'unhealthy';
};

const SiteMonitor: React.FC<SiteMonitorProps> = ({
  displayName,
  endpointUrl,
  widgetId,
}: SiteMonitorProps) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<HealthStatus>('unknown');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [responseText, setResponseText] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const checkHealth = useCallback(async () => {
    if (!endpointUrl) return;

    setIsChecking(true);

    try {
      const response = await new Promise<{ success: boolean; statusCode?: number; responseText?: string; error?: string }>(
        (resolve) => {
          chrome.runtime.sendMessage(
            { action: 'fetchHealthStatus', data: { endpointUrl } },
            (res) => {
              if (chrome.runtime.lastError) {
                resolve({ success: false, error: chrome.runtime.lastError.message });
              } else {
                resolve(res);
              }
            }
          );
        }
      );

      if (response.error && !response.responseText) {
        setStatus('unhealthy');
        setResponseText(response.error);
      } else {
        const text = response.responseText ?? '';
        setStatus(determineStatus(response.success ?? false, text));
        setResponseText(text);
      }
      setLastChecked(new Date());
    } finally {
      setIsChecking(false);
    }
  }, [endpointUrl]);

  // Initial health check on mount
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  // Widget removal cleanup
  useEffect(() => {
    if (!widgetId) return;
    const cleanup = addWidgetRemovalListener(widgetId, () => {});
    return cleanup;
  }, [widgetId]);

  const statusClass =
    status === 'healthy'
      ? styles.indicatorHealthy
      : status === 'degraded'
        ? styles.indicatorDegraded
        : status === 'unhealthy'
          ? styles.indicatorUnhealthy
          : styles.indicatorUnknown;

  const statusLabel =
    status === 'healthy'
      ? t('siteMonitor.status.healthy')
      : status === 'degraded'
        ? t('siteMonitor.status.degraded')
        : status === 'unhealthy'
          ? t('siteMonitor.status.unhealthy')
          : t('siteMonitor.status.unknown');

  return (
    <>
      <div className={widgetCommon.widgetTitle}>{displayName}</div>
      <div className={styles.container}>
        <div className={styles.indicatorRow}>
          <div
            className={`${styles.indicator} ${statusClass}`}
            onMouseEnter={() => setTooltipVisible(true)}
            onMouseLeave={() => setTooltipVisible(false)}
            role="status"
            aria-label={statusLabel}
          >
            {tooltipVisible && responseText && (
              <div className={styles.tooltip} role="tooltip">
                <pre className={styles.tooltipContent}>{responseText}</pre>
              </div>
            )}
          </div>
          <span className={styles.statusLabel}>{statusLabel}</span>
        </div>

        {lastChecked && (
          <div className={styles.lastChecked}>
            {t('siteMonitor.labels.lastChecked', {
              time: lastChecked.toLocaleTimeString(),
            })}
          </div>
        )}

        <button
          className={styles.refreshButton}
          onClick={checkHealth}
          disabled={isChecking || !endpointUrl}
          aria-label={t('common.buttons.refresh')}
        >
          {isChecking ? t('common.states.loading') : t('common.buttons.refresh')}
        </button>
      </div>
    </>
  );
};

export default SiteMonitor;
