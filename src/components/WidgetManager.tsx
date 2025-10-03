import React, { useState, useCallback, useMemo, useEffect, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardWidget, WidgetManagerProps, WidgetType, Dimensions, Position, CssStyle } from '../types/common';
import { widgetRegistry } from '../utils/widgetRegistry';
import { generateUniqueId, findOptimalPosition, getViewportDimensions } from '../utils/helpers';
import { defaultDimensions, } from '@/types/defaults';
import chromeStorage from '@/utils/chromeStorage';

const WidgetManager: React.FC<WidgetManagerProps> = ({
    onAddWidget,
    onRemoveWidget,
    existingWidgets,
    onBackgroundChange,
    isLocked
}: WidgetManagerProps) => {
    const { t } = useTranslation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWidgetType, setSelectedWidgetType] = useState<WidgetType | null>(null);
    const [widgetDimensions, setWidgetDimensions] = useState<Dimensions>();
    const [widgetPosition, setWidgetPosition] = useState<Position>();
    const [widgetStyle, setWidgetStyle] = useState<CssStyle>();

    const availableWidgets = useMemo(() => widgetRegistry.getAvailable(), []);
    const containerBounds = useMemo(() => getViewportDimensions(), []);
    const loadDefaults = async () => {
        const defaultStyle: CssStyle = (await chromeStorage.loadAllDefaults()).styling
        const defaultDimensions: Dimensions = (await chromeStorage.loadAllDefaults()).dimensions
        const defaultPosition: Position = (await chromeStorage.loadAllDefaults()).positioning
        return { defaultStyle, defaultDimensions, defaultPosition };
    }
    const resetModalState = useCallback(async () => {
        setSelectedWidgetType(null);
        var r = await loadDefaults();
        setWidgetDimensions(r.defaultDimensions);
        setWidgetPosition(r.defaultPosition);
        setWidgetStyle(r.defaultStyle);
    }, []);

    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true);
        resetModalState();
    }, [resetModalState]);

    const handleCloseModal = useCallback(() => {
        if (selectedWidgetType) {
            // First click: deselect widget type but keep modal open
            setSelectedWidgetType(null);
        } else {
            // Second click: close modal when no widget type is selected
            setIsModalOpen(false);
            resetModalState();
        }
    }, [selectedWidgetType, resetModalState]);

    const handleWidgetTypeSelect = useCallback((widgetType: WidgetType) => {
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

    const handleAddWidget = useCallback(() => {
        if (!selectedWidgetType) return;
        let widgetProps = { ...(selectedWidgetType.defaultProps || {}) };

        // Add background change handler for BackgroundManager
        if (selectedWidgetType.id === 'background-manager' && onBackgroundChange) {
            widgetProps = {
                ...widgetProps,
                onBackgroundChange
            };
        }

        const newWidget: DashboardWidget = {
            id: generateUniqueId(selectedWidgetType.id),
            allowMultiples: selectedWidgetType.allowMultiples,
            component: selectedWidgetType.component,
            dimensions: widgetDimensions,
            position: widgetPosition,
            props: widgetProps,
            style: widgetStyle
        };

        onAddWidget(newWidget);
        chromeStorage.saveAllDefaults({ styling: widgetStyle, dimensions: widgetDimensions, positioning: widgetPosition })
        setIsModalOpen(false);
        handleCloseModal();
    }, [selectedWidgetType, widgetDimensions, widgetPosition, widgetStyle, onBackgroundChange, onAddWidget, handleCloseModal]);

    const handleDimensionChange = useCallback((dimension: 'width' | 'height', value: number) => {
        setWidgetDimensions(prev => ({ ...prev, [dimension]: value }));
    }, []);

    const handlePositionChange = useCallback((axis: 'x' | 'y', value: number) => {
        setWidgetPosition(prev => ({ ...prev, [axis]: value }));
    }, []);

    const handleStyleChange = useCallback((property: keyof CssStyle, value: number) => {
        // Convert transparency from percentage to decimal
        const finalValue = property === 'transparency' ? value / 100 : value;
        setWidgetStyle(prev => {
            const newStyle = { ...prev, [property]: finalValue };
            console.log(`Style changed: ${property} = ${finalValue}`, newStyle);
            return newStyle;
        });
    }, []);

    const handlePropertyChange = useCallback((key: string, value: string) => {
        if (!selectedWidgetType) return;

        setSelectedWidgetType(prev => prev ? {
            ...prev,
            defaultProps: {
                ...prev.defaultProps,
                [key]: value
            }
        } : null);
    }, [selectedWidgetType]);

    const getWidgetDisplayName = useCallback((widget: DashboardWidget): string => {
        const widgetType = availableWidgets.find(w => widget.id.startsWith(w.id));
        return widgetType?.name || t('widgetManager.labels.unknownWidget', { unknown: t('common.states.unknown') });
    }, [availableWidgets, t]);

    const renderWidgetTypeCard = useCallback((widgetType: WidgetType) => (
        (() => {
            const component = existingWidgets.find(widget => widget.id.startsWith(widgetType.id));
            if (component && component.allowMultiples === false) {
                return (
                    <div></div>
                );
            }
            return (
                <div
                    key={widgetType.id}
                    className={`widget-type-card ${selectedWidgetType?.id === widgetType.id ? 'selected' : ''}`}
                    onClick={() => handleWidgetTypeSelect(widgetType)}
                >
                    <h4>{widgetType.name}</h4>
                    <p>{widgetType.description}</p>
                </div>
            );
        })()
    ), [selectedWidgetType, handleWidgetTypeSelect]);

    const renderDimensionInput = useCallback((
        dimension: 'width' | 'height',
        value: number,
        min: number,
        max: number
    ) => (
        <div className="dimension-field">
            <label className="dimension-label">
                {t(`widgetManager.labels.${dimension}`)}
            </label>
            <div className="input-with-unit">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    onChange={(e) => handleDimensionChange(dimension, parseInt(e.target.value) || value)}
                />
                <span className="input-unit">{t('widgetManager.units.pixels')}</span>
            </div>
        </div>
    ), [handleDimensionChange, t]);

    const renderPositionInput = useCallback((
        axis: 'x' | 'y',
        value: number,
        translationKey: string
    ) => (
        <div className="position-field">
            <label className="position-label">{t(translationKey)}</label>
            <div className="input-with-unit">
                <input
                    type="number"
                    value={value}
                    min={0}
                    onChange={(e) => handlePositionChange(axis, parseInt(e.target.value) || 0)}
                />
                <span className="input-unit">{t('widgetManager.units.pixels')}</span>
            </div>
        </div>
    ), [handlePositionChange, t]);

    const renderStyleInput = useCallback((
        property: keyof CssStyle,
        value: number,
        label: string,
        min: number = 0,
        max: number = 100,
        step: number = 1
    ) => (
        <div className="style-field">
            <label className="style-label">{label}</label>
            <div className="input-with-unit">
                <input
                    type="number"
                    value={value}
                    min={min}
                    max={max}
                    step={step}
                    onChange={(e) => handleStyleChange(property, parseFloat(e.target.value) || 0)}
                />
                <span className="input-unit">
                    {property === 'transparency' ? '%' : property.includes('backgroundColor') ? '' : 'px'}
                </span>
            </div>
        </div>
    ), [handleStyleChange]);

    const renderColorInput = useCallback((
        property: 'backgroundColorRed' | 'backgroundColorGreen' | 'backgroundColorBlue',
        value: number,
        label: string
    ) => (
        <div className="color-field">
            <label className="color-label">{label}</label>
            <div className="color-input-container">
                <input
                    type="range"
                    value={value}
                    min={0}
                    max={255}
                    onChange={(e) => handleStyleChange(property, parseInt(e.target.value))}
                    className="color-slider"
                />
                <input
                    type="number"
                    value={value}
                    min={0}
                    max={255}
                    onChange={(e) => handleStyleChange(property, parseInt(e.target.value) || 0)}
                    className="color-number"
                />
            </div>
        </div>
    ), [handleStyleChange]);

    return (
        isLocked ? (
            <></>
        ) : (
            <div className='widget-manager'>
                <div className="widgets-list">
                    <button
                        className="add-widget-btn"
                        onClick={handleOpenModal}
                        title={t('widgetManager.tooltips.addWidget')}
                    >
                        <span className="btn-icon">➕</span>
                        {t('widgetManager.buttons.addWidget')}
                    </button>
                    {existingWidgets.length > 0 &&
                        existingWidgets.map((widget) => (
                            <div key={widget.id} className="widget-item">
                                <span className="widget-name">
                                    {getWidgetDisplayName(widget)}
                                </span>
                                <button
                                    className="remove-widget-btn"
                                    onClick={() => onRemoveWidget(widget.id)}
                                    title={t('widgetManager.tooltips.removeWidget')}
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                </div>

                {isModalOpen && (
                    <div className="modal-overlay" onClick={handleCloseModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>{t('widgetManager.modal.title')}</h2>
                                <button className="modal-close" onClick={handleCloseModal}>
                                    ✕
                                </button>
                            </div>

                            <div className="modal-body">
                                {!selectedWidgetType && (
                                    <div className="form-section">
                                        <h3>{t('widgetManager.modal.sections.chooseType')}</h3>
                                        <div className="widget-types">
                                            {availableWidgets.map((widgetType) => (
                                                <React.Fragment key={widgetType.id}>
                                                    {renderWidgetTypeCard(widgetType)}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>)}

                                {selectedWidgetType && (
                                    <>
                                        <div className="section form-section">
                                            <h3>{t('widgetManager.modal.sections.styling')}</h3>
                                            <div className="styling-options">
                                                <div className="style-row">
                                                    {renderStyleInput('border', widgetStyle.border, t('widgetManager.labels.border'), 0, 10)}
                                                    {renderStyleInput('radius', widgetStyle.radius, t('widgetManager.labels.radius'), 0, 50)}
                                                </div>
                                                <div className="style-row">
                                                    {renderStyleInput('blur', widgetStyle.blur, t('widgetManager.labels.blur'), 0, 20)}
                                                    {renderStyleInput('transparency', Math.round(widgetStyle.transparency * 100), t('widgetManager.labels.transparency'), 0, 100, 5)}
                                                </div>
                                                <div className="section color-section">
                                                    <h4>{t('widgetManager.labels.backgroundColor')}</h4>
                                                    <div className="color-preview" style={{
                                                        backgroundColor: `rgba(${widgetStyle.backgroundColorRed}, ${widgetStyle.backgroundColorGreen}, ${widgetStyle.backgroundColorBlue}, ${widgetStyle.transparency})`,
                                                        width: '100%',
                                                        height: '40px',
                                                        borderRadius: '4px',
                                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                                        marginBottom: '10px'
                                                    }}></div>
                                                    <div className="color-controls">
                                                        {renderColorInput('backgroundColorRed', widgetStyle.backgroundColorRed, t('widgetManager.labels.red'))}
                                                        {renderColorInput('backgroundColorGreen', widgetStyle.backgroundColorGreen, t('widgetManager.labels.green'))}
                                                        {renderColorInput('backgroundColorBlue', widgetStyle.backgroundColorBlue, t('widgetManager.labels.blue'))}
                                                    </div>
                                                </div>

                                                <div className="section text-align-section">
                                                    <h4>{t('widgetManager.labels.textAlign')}</h4>
                                                    <div className="text-align-options">
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="textAlign"
                                                                value="left"
                                                                checked={widgetStyle.alignment === 'left'}
                                                                onChange={() => handleStyleChange('alignment', 'left' as any)}
                                                            />
                                                            {t('widgetManager.labels.left')}
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="textAlign"
                                                                value="center"
                                                                checked={widgetStyle.alignment === 'center'}
                                                                onChange={() => handleStyleChange('alignment', 'center' as any)}
                                                            />
                                                            {t('widgetManager.labels.center')}
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="textAlign"
                                                                value="right"
                                                                checked={widgetStyle.alignment === 'right'}
                                                                onChange={() => handleStyleChange('alignment', 'right' as any)}
                                                            />
                                                            {t('widgetManager.labels.right')}
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="section justify-section">
                                                    <h4>{t('widgetManager.labels.justify')}</h4>
                                                    <div className="justify-options">
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="justify"
                                                                value="flex-start"
                                                                checked={widgetStyle.justify === 'flex-start'}
                                                                onChange={() => handleStyleChange('justify', 'flex-start' as any)}
                                                            />
                                                            {t('widgetManager.labels.justifyStart')}
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="justify"
                                                                value="center"
                                                                checked={widgetStyle.justify === 'center'}
                                                                onChange={() => handleStyleChange('justify', 'center' as any)}
                                                            />
                                                            {t('widgetManager.labels.justifyCenter')}
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="justify"
                                                                value="flex-end"
                                                                checked={widgetStyle.justify === 'flex-end'}
                                                                onChange={() => handleStyleChange('justify', 'flex-end' as any)}
                                                            />
                                                            {t('widgetManager.labels.justifyEnd')}
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="justify"
                                                                value="space-between"
                                                                checked={widgetStyle.justify === 'space-between'}
                                                                onChange={() => handleStyleChange('justify', 'space-between' as any)}
                                                            />
                                                            {t('widgetManager.labels.justifyBetween')}
                                                        </label>
                                                        <label>
                                                            <input
                                                                type="radio"
                                                                name="justify"
                                                                value="space-around"
                                                                checked={widgetStyle.justify === 'space-around'}
                                                                onChange={() => handleStyleChange('justify', 'space-around' as any)}
                                                            />
                                                            {t('widgetManager.labels.justifyAround')}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {selectedWidgetType.defaultProps && Object.entries(selectedWidgetType.defaultProps).length > 0 && (
                                            <div className="form-section additional-properties">
                                                <h3>{t('widgetManager.modal.sections.properties')}</h3>
                                                <div className="properties-grid">
                                                    {Object.entries(selectedWidgetType.defaultProps).map(([key, value]) => (
                                                        <div key={key} className="property-field">
                                                            <label className="property-label">
                                                                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={String(value ?? '')}
                                                                placeholder={`Enter ${key.toLowerCase()}`}
                                                                onChange={(e) => handlePropertyChange(key, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={handleCloseModal}>
                                    {t('common.buttons.cancel')}
                                </button>
                                <button
                                    className="btn-primary"
                                    onClick={handleAddWidget}
                                    disabled={!selectedWidgetType}
                                >
                                    {t('widgetManager.buttons.addWidget')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    );
};

export default React.memo(WidgetManager);