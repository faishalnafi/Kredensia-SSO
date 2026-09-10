import React, { useState, useEffect, useRef } from 'react';

/**
 * Konversi tanggal ISO (YYYY-MM-DD) ke format Indonesia (DD/MM/YYYY)
 */
export const isoKeTglIndo = (iso) => {
    if (!iso) return '';
    const cleanIso = String(iso).split('T')[0];
    const parts = cleanIso.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
        const [tahun, bulan, tanggal] = parts;
        return `${tanggal}/${bulan}/${tahun}`;
    }
    return iso;
};

/**
 * Konversi format Indonesia (DD/MM/YYYY) ke ISO (YYYY-MM-DD)
 */
export const tglIndoKeIso = (indo) => {
    if (!indo) return '';
    const parts = indo.split('/');
    if (parts.length === 3 && parts[2].length === 4) {
        const [tanggal, bulan, tahun] = parts;
        const d = parseInt(tanggal, 10);
        const m = parseInt(bulan, 10);
        const y = parseInt(tahun, 10);
        if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1900 && y <= 2100) {
            return `${tahun}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        }
    }
    return '';
};

/**
 * Komponen Input Tanggal Seragam dengan format Tanggal/Bulan/Tahun (DD/MM/YYYY)
 */
export default function InputTanggal({
    id,
    name,
    value = '',
    onChange,
    className = '',
    placeholder = 'dd/mm/yyyy',
    required = false,
    disabled = false,
    max,
    min,
}) {
    const hiddenDateRef = useRef(null);

    const cleanIsoValue = value ? String(value).split('T')[0] : '';
    const [teks, setTeks] = useState(() => isoKeTglIndo(cleanIsoValue));

    useEffect(() => {
        setTeks(isoKeTglIndo(cleanIsoValue));
    }, [cleanIsoValue]);

    const handleInput = (e) => {
        const inputVal = e.target.value;
        const digits = inputVal.replace(/\D/g, '');

        let formatted = '';
        if (digits.length > 0) {
            formatted = digits.slice(0, 2);
            if (digits.length >= 3) {
                formatted += '/' + digits.slice(2, 4);
            }
            if (digits.length >= 5) {
                formatted += '/' + digits.slice(4, 8);
            }
        }

        setTeks(formatted);

        if (formatted.length === 10) {
            const iso = tglIndoKeIso(formatted);
            if (iso && onChange) {
                onChange({
                    target: {
                        id,
                        name: name || id,
                        value: iso,
                    },
                });
            }
        } else if (formatted.length === 0) {
            if (onChange) {
                onChange({
                    target: {
                        id,
                        name: name || id,
                        value: '',
                    },
                });
            }
        }
    };

    const handleBlur = () => {
        if (teks.length > 0 && teks.length < 10) {
            setTeks(isoKeTglIndo(cleanIsoValue));
        } else if (teks.length === 10) {
            const iso = tglIndoKeIso(teks);
            if (!iso) {
                setTeks(isoKeTglIndo(cleanIsoValue));
            }
        }
    };

    const bukaKalender = () => {
        if (disabled) return;
        if (hiddenDateRef.current) {
            try {
                if (hiddenDateRef.current.showPicker) {
                    hiddenDateRef.current.showPicker();
                } else {
                    hiddenDateRef.current.focus();
                }
            } catch {
                hiddenDateRef.current.focus();
            }
        }
    };

    const handleHiddenDateChange = (e) => {
        const newIso = e.target.value;
        setTeks(isoKeTglIndo(newIso));
        if (onChange) {
            onChange({
                target: {
                    id,
                    name: name || id,
                    value: newIso,
                },
            });
        }
    };

    return (
        <div className="relative w-full">
            <input
                id={id}
                name={name}
                type="text"
                inputMode="numeric"
                placeholder={placeholder}
                maxLength={10}
                value={teks}
                onChange={handleInput}
                onBlur={handleBlur}
                required={required}
                disabled={disabled}
                className={`pr-10 ${className}`}
            />
            
            <button
                type="button"
                onClick={bukaKalender}
                disabled={disabled}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#0F91FC] dark:hover:text-[#0F91FC] transition-colors cursor-pointer p-0.5 flex items-center justify-center"
                title="Buka kalender (Tanggal/Bulan/Tahun)"
                tabIndex={-1}
            >
                <span className="material-symbols-rounded text-lg">calendar_today</span>
            </button>

            <input
                ref={hiddenDateRef}
                type="date"
                tabIndex={-1}
                value={cleanIsoValue}
                max={max}
                min={min}
                onChange={handleHiddenDateChange}
                className="sr-only"
                aria-hidden="true"
            />
        </div>
    );
}
