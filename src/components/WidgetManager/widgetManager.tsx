import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DashboardWidget,
  WidgetManagerProps,
  WidgetType,
  Dimensions,
  Position,
  CssStyle,
  isSecureProperty
} from '../../types/common';
import { widgetRegistry } from '../../utils/widgetRegistry';
import { generateUniqueId, findOptimalPosition, getViewportDimensions } from '../../utils/helpers';
import { defaultDimensions, defaultPosition, defaultStyle } from '@/types/defaults';
import chromeStorage, { SerializedWidget } from '@/utils/chromeStorage';
import Modal from '../Modal';
import { WIDGET_EVENTS, widgetEventManager, WidgetEvent } from '@/utils/widgetEvents';
import styles from './widgetManager.module.css';

const WidgetManager: React.FC<WidgetManagerProps> = ({
  onAddWidget,
  onEditingWidget,
  existingWidgets,
  onBackgroundChange,
  isLocked,
}: WidgetManagerProps) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState<WidgetType | null>(null);
  const [widgetDimensions, setWidgetDimensions] = useState<Dimensions>(defaultDimensions);
  const [widgetPosition, setWidgetPosition] = useState<Position>(defaultPosition);
  const [widgetStyle, setWidgetStyle] = useState<CssStyle>(defaultStyle);
  const [modalContent, setModalContent] = useState<{
    title: string | React.ReactNode; content: React.ReactNode,
    actions: Array<{ index: number, text: string; onClick: () => void }>
  } | null>(null);
  const availableWidgets = useMemo(() => widgetRegistry.getAllLocalized(t), [t]);
  const containerBounds = useMemo(() => getViewportDimensions(), []);
  const loadDefaults = useCallback(async () => {
    const defaultStyle: CssStyle = (await chromeStorage.loadAllDefaults()).styling;
    const defaultDimensions: Dimensions = (await chromeStorage.loadAllDefaults()).dimensions;
    const defaultPosition: Position = (await chromeStorage.loadAllDefaults()).positioning;
    return { defaultStyle, defaultDimensions, defaultPosition };
  }, []);
  const [data, setData] = useState<{ widgets: SerializedWidget[], backgroundImage: string, isLocked: boolean, timestamp: number, exportMetadata: { secretProps: Array<{ name: string, key: string, value?: string }> } }>({ widgets: [], backgroundImage: '', isLocked: false, timestamp: Date.now(), exportMetadata: { secretProps: [] } });
  // Function to generate default modal content - moved after all handlers are defined
  const getDefaultModalContent = useCallback(() => (
    <div className={styles.formSection}>
      <h3>{t('widgetManager.modal.sections.chooseType')}</h3>
      <div className={styles.widgetTypes}>{availableWidgets.map((widgetType: WidgetType) => {
        const component = existingWidgets.find((widget) => widget.id.startsWith(widgetType.id));
        if (component && component.allowMultiples === false) {
          return <></>;
        }
        return (
          <div
            key={widgetType.id}
            className={`${styles.widgetTypeCard} ${selectedWidgetType?.id === widgetType.id ? styles.selected : ''}`}
            onClick={() => handleWidgetTypeSelect(widgetType)}
          >
            <h4>{widgetType.name}</h4>
            <p>{widgetType.description}</p>
          </div>
        );
      })}</div>
    </div>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [t, availableWidgets, existingWidgets, selectedWidgetType]);

  const resetModalState = useCallback(async () => {
    setSelectedWidgetType(null);
    setModalContent({
      content: getDefaultModalContent(),
      title: t('widgetManager.modal.title'),
      actions: [
        {
          index: 1,
          text: t('common.buttons.cancel'),
          onClick: () => {
            setIsModalOpen(false);
            setModalContent(null);
            setSelectedWidgetType(null);
          }
        }]
    });
    const r = await loadDefaults();
    setWidgetDimensions(r.defaultDimensions);
    setWidgetPosition(r.defaultPosition);
    setWidgetStyle(r.defaultStyle);
  }, [getDefaultModalContent, loadDefaults, t]);

  useEffect(() => {
    setIsModalOpen(modalContent === null ? false : true);
  }, [modalContent]);

  useEffect(() => {
    const handleWidgetEditing = (event: WidgetEvent) => {
      if (event.widgetId) {
        const widgeta = existingWidgets.find(w => w.id === event.widgetId);
        const wt  = widgeta as unknown as WidgetType;
        wt.defaultProps = widgeta?.props || {};
        setSelectedWidgetType(wt);
        setWidgetDimensions(widgeta?.dimensions || defaultDimensions);
        setWidgetPosition(widgeta?.position || defaultPosition);
        setWidgetStyle(widgeta?.style || defaultStyle);
        existingWidgets = existingWidgets.splice(existingWidgets.indexOf(widgeta!), 1);
        setIsModalOpen(true);
      }
    };

    widgetEventManager.addEventListener(WIDGET_EVENTS.WIDGET_EDITED, handleWidgetEditing);

    return () => {
      widgetEventManager.removeEventListener(WIDGET_EVENTS.WIDGET_EDITED, handleWidgetEditing);
    };
  }, [onEditingWidget]);

  useEffect(() => {
    if (data.exportMetadata.secretProps && data.exportMetadata.secretProps.length > 0) {
      const fieldsData = data.exportMetadata.secretProps.map(({ name, key, value }, idx) => {
        return (<React.Fragment key={`${idx}_${key}`}>{renderTextInput(!value ? '' : value, `${name}_${key}`, value, (e) => {
          const newData = { ...data };
          newData.exportMetadata.secretProps[idx].value = e.target.value;
          setData(newData);
        })}</React.Fragment>);
      });
      setModalContent({
        title: t('widgetManager.modal.titleImportSecrets'), content: fieldsData, actions: [{
          index: 1, text: 'Cancel', onClick: () => {
            setIsModalOpen(false);
            setModalContent(null);
            setSelectedWidgetType(null);
          }
        },
        {
          index: 0,
          text: 'Save',
          onClick: async () => {
            // now we need to go find the widgets where the id matches
            data.exportMetadata.secretProps.map(({ name, key, value }) => {
              const w = data.widgets.find(widget => widget.id === name);
              if (w) {
                w.props = { ...w.props, [key]: value };
              }
            });
            const serializedWidgets = data.widgets.map((widget) => ({
              ...widget,
              // Ensure props are serializable and match SerializedWidget type
              props: { ...widget.props }
            }));

            await chromeStorage.saveWidgets(serializedWidgets);
            await chromeStorage.saveBackground(data.backgroundImage);
            setModalContent({
              title: 'Import Successful', content: "Data imported successfully", actions: [{
                index: 1, text: 'Refresh', onClick: () => {
                  window.location.reload();
                }
              }]
            });
          }
        }]
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (!selectedWidgetType) return;
    setModalContent({
      title: (<><p>{t('widgetManager.modal.title')}</p> <sub>({selectedWidgetType.name})</sub></>),
      content:
        <>
          <div className={`section ${styles.formSection}`}>
            <h3>{t('widgetManager.modal.sections.styling')}</h3>
            <div className={styles.stylingOptions}>
              <div className={styles.styleRow}>
                {renderStyleInput(
                  'border',
                  widgetStyle?.border ?? 0,
                  t('widgetManager.labels.border'),
                  0,
                  10
                )}
                {renderStyleInput(
                  'radius',
                  widgetStyle?.radius ?? 12,
                  t('widgetManager.labels.radius'),
                  0,
                  50
                )}
              </div>
              <div className={styles.styleRow}>
                {renderStyleInput(
                  'blur',
                  widgetStyle?.blur ?? 10,
                  t('widgetManager.labels.blur'),
                  0,
                  20
                )}
                {renderStyleInput(
                  'transparency',
                  Math.round((widgetStyle?.transparency ?? 0.5) * 100),
                  t('widgetManager.labels.transparency'),
                  0,
                  100,
                  5
                )}
              </div>
              <div className={`${styles.section} ${styles.colorSection}`}>
                <h4>{t('widgetManager.labels.backgroundColor')}</h4>
                <div
                  className={styles.colorPreview}
                  style={{
                    backgroundColor: `rgba(${widgetStyle?.backgroundColorRed ?? 30}, ${widgetStyle?.backgroundColorGreen ?? 214}, ${widgetStyle?.backgroundColorBlue ?? 230}, ${widgetStyle?.transparency ?? 0.5})`,
                    width: '100%',
                    height: '40px',
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    marginBottom: '10px',
                  }}
                ></div>
                <div className={styles.colorControls}>
                  {renderColorInput(
                    'backgroundColorRed',
                    widgetStyle?.backgroundColorRed ?? 30,
                    t('widgetManager.labels.red')
                  )}
                  {renderColorInput(
                    'backgroundColorGreen',
                    widgetStyle?.backgroundColorGreen ?? 214,
                    t('widgetManager.labels.green')
                  )}
                  {renderColorInput(
                    'backgroundColorBlue',
                    widgetStyle?.backgroundColorBlue ?? 230,
                    t('widgetManager.labels.blue')
                  )}
                </div>
              </div>
              <div className={`${styles.section} ${styles.colorSection}`}>
                <h4>{t('widgetManager.labels.textColor')}</h4>
                <div
                  className={styles.colorPreview}
                  style={{
                    display: 'flex',
                    backgroundColor: `rgba(${widgetStyle?.backgroundColorRed ?? 30}, ${widgetStyle?.backgroundColorGreen ?? 214}, ${widgetStyle?.backgroundColorBlue ?? 230}, ${widgetStyle?.transparency ?? 0.5})`,
                    color: `rgb(${widgetStyle?.textColorRed ?? 230}, ${widgetStyle?.textColorGreen ?? 114}, ${widgetStyle?.textColorBlue ?? 30})`,
                    width: '100%',
                    height: '40px',
                    alignItems: widgetStyle?.alignment ?? 'center',
                    justifyContent: widgetStyle?.justify ?? 'center',
                    borderRadius: '4px',
                    fontSize: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    marginBottom: '10px',
                  }}
                >{t('widgetManager.labels.textColor')}</div>
                <div className={styles.colorControls}>
                  {renderColorInput(
                    'textColorRed',
                    widgetStyle?.textColorRed ?? 230,
                    t('widgetManager.labels.red')
                  )}
                  {renderColorInput(
                    'textColorGreen',
                    widgetStyle?.textColorGreen ?? 114,
                    t('widgetManager.labels.green')
                  )}
                  {renderColorInput(
                    'textColorBlue',
                    widgetStyle?.textColorBlue ?? 30,
                    t('widgetManager.labels.blue')
                  )}
                </div>
              </div>

              <div className={`${styles.section} ${styles.textAlignSection}`}>
                <h4>{t('widgetManager.labels.textAlign')}</h4>
                <div className={styles.textAlignOptions}>
                  <label>
                    <input
                      type="radio"
                      name="textAlign"
                      value="left"
                      checked={(widgetStyle?.alignment ?? 'center') === 'flex-start'}
                      onChange={() => handleStyleChange('alignment', 'flex-start' as unknown as number)}
                    />
                    {t('widgetManager.labels.left')}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="textAlign"
                      value="center"
                      checked={(widgetStyle?.alignment ?? 'center') === 'center'}
                      onChange={() => handleStyleChange('alignment', 'center' as unknown as number)}
                    />
                    {t('widgetManager.labels.center')}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="textAlign"
                      value="right"
                      checked={(widgetStyle?.alignment ?? 'center') === 'flex-end'}
                      onChange={() => handleStyleChange('alignment', 'flex-end' as unknown as number)}
                    />
                    {t('widgetManager.labels.right')}
                  </label>
                </div>
              </div>
              <div className={`${styles.section} ${styles.justifySection}`}>
                <h4>{t('widgetManager.labels.justify')}</h4>
                <div className={styles.justifyOptions}>
                  <label>
                    <input
                      type="radio"
                      name="justify"
                      value="flex-start"
                      checked={(widgetStyle?.justify ?? 'center') === 'flex-start'}
                      onChange={() => handleStyleChange('justify', 'flex-start' as unknown as number)}
                    />
                    {t('widgetManager.labels.justifyStart')}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="justify"
                      value="center"
                      checked={(widgetStyle?.justify ?? 'center') === 'center'}
                      onChange={() => handleStyleChange('justify', 'center' as unknown as number)}
                    />
                    {t('widgetManager.labels.justifyCenter')}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="justify"
                      value="flex-end"
                      checked={(widgetStyle?.justify ?? 'center') === 'flex-end'}
                      onChange={() => handleStyleChange('justify', 'flex-end' as unknown as number)}
                    />
                    {t('widgetManager.labels.justifyEnd')}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="justify"
                      value="space-between"
                      checked={(widgetStyle?.justify ?? 'center') === 'space-between'}
                      onChange={() => handleStyleChange('justify', 'space-between' as unknown as number)}
                    />
                    {t('widgetManager.labels.justifyBetween')}
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="justify"
                      value="space-around"
                      checked={(widgetStyle?.justify ?? 'center') === 'space-around'}
                      onChange={() => handleStyleChange('justify', 'space-around' as unknown as number)}
                    />
                    {t('widgetManager.labels.justifyAround')}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {selectedWidgetType.defaultProps &&
            Object.entries(selectedWidgetType.defaultProps).length > 0 && (
              <div className={`${styles.formSection} ${styles.additionalProperties}`}>
                <h3>{t('widgetManager.modal.sections.properties')}</h3>
                <div className={styles.propertiesGrid}>
                  {Object.entries(selectedWidgetType.defaultProps).map(([key, value]) => {
                    return (
                      <div key={key} className={styles.propertyField}>
                        <label className={styles.propertyLabel}>
                          {key.charAt(0).toUpperCase() +
                            key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </label>
                        {

                          typeof value === 'boolean' ? (
                            <label className={styles.toggleSwitch}>
                              <input
                                type="checkbox"
                                checked={value}
                                onChange={(e) => handlePropertyChange(key, e.target.checked)}
                              />
                              <span className={styles.slider} />
                            </label>
                          ) : !key.toLowerCase().includes('format') && key.toLowerCase().includes('date') && (value.toString().length > 6) ? (
                            <input
                              type="date"
                              value={String(value ?? '')}
                              onChange={(e) => handlePropertyChange(key, e.target.value)}
                            />
                          ) : key.toLowerCase().includes('number') || key.toLowerCase().includes('currentsprint') ? (
                            <input
                              type="number"
                              value={String(value ?? '')}
                              placeholder={`Enter ${key.toLowerCase()}`}
                              onChange={(e) => handlePropertyChange(key, e.target.value)}
                            />
                          ) : (
                            <input
                              type="text"
                              value={String(value ?? '')}
                              placeholder={`Enter ${key.toLowerCase()}`}
                              onChange={(e) => handlePropertyChange(key, e.target.value)}
                            />
                          )
                        }
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </>,
      actions: [{
        index: 0,
        text: t('widgetManager.buttons.addWidget'),
        onClick: () => {
          if (!selectedWidgetType) {
            console.error('No widget type selected!');
            return;
          }

          let widgetProps = { ...(selectedWidgetType.defaultProps || {}) };

          // Add background change handler for BackgroundManager
          if (selectedWidgetType.id === 'background-manager' && onBackgroundChange) {
            widgetProps = {
              ...widgetProps,
              onBackgroundChange,
            };
          }

          const newWidget: DashboardWidget = {
            id: generateUniqueId(selectedWidgetType.id),
            name: selectedWidgetType.name,
            description: selectedWidgetType.description,
            isRuntimeVisible: selectedWidgetType.isRuntimeVisible,
            allowMultiples: selectedWidgetType.allowMultiples,
            wikiPage: selectedWidgetType.wikiPage,
            component: selectedWidgetType.component,
            dimensions: widgetDimensions,
            position: widgetPosition,
            props: widgetProps,
            style: widgetStyle,
          };

          onAddWidget(newWidget);
          chromeStorage.saveAllDefaults({
            styling: widgetStyle,
            dimensions: widgetDimensions,
            positioning: widgetPosition,
          });

          // Close modal and reset state properly
          setIsModalOpen(false);
          setModalContent(null);
          setSelectedWidgetType(null);
        }
      }, {
        index: 1,
        text: t('common.buttons.cancel'),
        onClick: handleCloseModal
      }]
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widgetStyle, selectedWidgetType]);

  const handleAction = useCallback(async (action: 'addWidget' | 'import' | 'export') => {
    switch (action) {
      case 'addWidget':
        setIsModalOpen(true);
        resetModalState();
        break;
      case 'import':
        try {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'application/json';
          input.onchange = async (e: Event) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
              const file = target.files[0];
              const text = await file.text();
              const myData = JSON.parse(text);
              if (myData.exportMetadata.secretProps && myData.exportMetadata.secretProps.length > 0) {
                const fieldsData = myData.exportMetadata.secretProps.map(({ name, key, value }, idx) => {
                  return (<React.Fragment key={`${idx}_${key}`}>{renderTextInput(!value ? '' : value, `${name}_${key}`, value, (e) => {
                    const newData = { ...myData };
                    newData.exportMetadata.secretProps[idx].value = e.target.value;
                    setData(newData);
                  })}</React.Fragment>);
                });
                setModalContent({ title: t('widgetManager.modal.titleImport'), content: fieldsData, actions: [] });
              }
              else {
                await chromeStorage.saveWidgets(myData.widgets);
                await chromeStorage.saveBackground(myData.backgroundImage);
                setModalContent({
                  title: 'Import Successful', content: "Data imported successfully", actions: [{
                    index: 1, text: 'Refresh', onClick: () => {
                      window.location.reload();
                    }
                  }]
                });
              }
            }
          }
          input.click();
        } catch (e) {
          console.error('Import failed:', e);
          // Consider showing user-friendly error notification
        }
        break;
      case 'export':
        // Handle export action
        try {
          const data = await chromeStorage.loadAll();

          // Find all widgets that contain InternalString properties and sanitize them
          const exportedData = {
            widgets: [],
            secretProps: []
          };
          data.widgets?.map((widget: SerializedWidget) => {
            const sanitizedWidget = { ...widget };
            if (widget.props) {
              // iterate over the props and sanitize any props that isSecureProperty
              Object.keys(widget.props).forEach((key, _) => {
                if (isSecureProperty(key)) {
                  sanitizedWidget.props[key] = '[REDACTED]';
                  exportedData.secretProps.push({ name: widget.id, key });
                }
              });
            }
            exportedData.widgets.push(sanitizedWidget);
          });
          // Create export data with sanitized widgets
          const exportData = {
            ...data,
            widgets: exportedData.widgets,
            exportMetadata: {
              exportedAt: new Date().toISOString(),
              version: '1.0.0',
              securityNote: 'InternalString properties (tokens, credentials, sensitive data) have been removed for security',
              secretProps: exportedData.secretProps
            }
          };

          // Create and download the export file
          const exportBlob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
          });

          const downloadUrl = URL.createObjectURL(exportBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.download = `quantum-tab-export-${new Date().toISOString().slice(0, 10)}.json`;

          // Trigger download
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);

          // Clean up the URL object
          URL.revokeObjectURL(downloadUrl);


        } catch (error) {
          console.error('Export failed:', error);
          // Consider showing user-friendly error notification
        }

        break;
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetModalState]);

  const handleCloseModal = useCallback(() => {
    if (selectedWidgetType) {
      // First click: deselect widget type and show default content
      setSelectedWidgetType(null);
      setModalContent({
        content: getDefaultModalContent(),
        title: t('widgetManager.modal.title'),
        actions: [
          {
            index: 1,
            text: t('common.buttons.cancel'),
            onClick: () => {
              setIsModalOpen(false);
              setModalContent(null);
              setSelectedWidgetType(null);
            }
          }]
      });
    } else {
      // Second click: close modal completely
      setIsModalOpen(false);
      setModalContent(null);
      setSelectedWidgetType(null);
    }
  }, [selectedWidgetType, getDefaultModalContent, t]);

  const handleWidgetTypeSelect = useCallback(
    (widgetType: WidgetType) => {
      setSelectedWidgetType(widgetType);
      setWidgetDimensions(widgetType.defaultDimensions);
      // Auto-calculate optimal position
      const optimalPosition = findOptimalPosition(
        widgetType.defaultDimensions,
        existingWidgets,
        containerBounds
      );
      setWidgetPosition(optimalPosition);
    }, [existingWidgets, containerBounds]);

  const handleStyleChange = useCallback((property: keyof CssStyle, value: number | string) => {
    // Convert transparency from percentage to decimal
    const finalValue = property === 'transparency' ? (typeof value === 'number' ? value / 100 : 0) : value;
    setWidgetStyle((prev) => {
      const newStyle = { ...prev, [property]: finalValue };
      return newStyle;
    });
  }, []);

  const handleTextInputChange = useCallback((property: string, value: string) => {
    // Convert transparency from percentage to decimal
    setWidgetStyle((prev) => {
      const newInputValue = { ...prev, [property]: value };
InputChange(property, e.target.value)}
          />
        </div>
      </div>
    ),
    [handleTextInputChange]
  );

  const renderStyleInput = useCallback(
    (
      property: keyof CssStyle,
      value: number,
      label: string,
      min: number = 0,
      max: number = 100,
      step: number = 1
    ) => (
      <div className={styles.styleField}>
        <label className={styles.styleLabel}>{label}</label>
        <div className={styles.inputWithUnit}>
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => handleStyleChange(property, parseFloat(e.target.value) || 0)}
          />
          <span className={styles.inputUnit}>
            {property === 'transparency' ? '%' : property.includes('backgroundColor') ? '' : 'px'}
          </span>
        </div>
      </div>
    ),
    [handleStyleChange]
  );

  const renderColorInput = useCallback(
    (
      property: 'backgroundColorRed' | 'backgroundColorGreen' | 'backgroundColorBlue' | 'textColorRed' | 'textColorGreen' | 'textColorBlue',
      value: number,
      label: string
    ) => (
      <div className={styles.colorField}>
        <label className={styles.colorLabel}>{label}</label>
        <div className={styles.colorInputContainer}>
          <input
            type="range"
            value={value}
            min={0}
            max={255}
            onChange={(e) => handleStyleChange(property, parseInt(e.target.value))}
            className={styles.colorSlider}
          />
          <input
            type="number"
            value={value}
            min={0}
            max={255}
            onChange={(e) => handleStyleChange(property, parseInt(e.target.value) || 0)}
            className={styles.colorNumber}
          />
        </div>
      </div>
    ),
    [handleStyleChange]
  );

  return isLocked ? (
    <></>
  ) : (
    <div className={styles.widgetManager}>
      <div className={styles.widgetsList}>
        <button
          className={styles.btn}
          onClick={() => handleAction('addWidget')}
          title={t('widgetManager.tooltips.addWidget')}
        >
          <span className={styles.btnIcon}>➕</span>
          {t('widgetManager.buttons.addWidget')}
        </button>
        <button
          className={styles.btn}
          onClick={() => handleAction('export')}
          title={t('widgetManager.tooltips.exportWidgets')}
        >
          <span className={styles.btnIcon}>📤</span>
          {t('widgetManager.buttons.exportWidgets')}
        </button>
        <button
          className={styles.btn}
          onClick={() => handleAction('import')}
          title={t('widgetManager.tooltips.importWidgets')}
        >
          <span className={styles.btnIcon}>📥</span>
          {t('widgetManager.buttons.importWidgets')}
        </button>
      </div>
      {isModalOpen && modalContent !== null && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          content={modalContent}
        >
        </Modal>
      )}
    </div>
  );
};

export default React.memo(WidgetManager);
