import React from 'react';
import { useTheme } from '../Contexts/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shadow-inner border border-gray-200 dark:border-gray-700 w-max">
            <button
                onClick={() => setTheme('light')}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                    theme === 'light'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Mode Terang"
            >
                <Sun className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('system')}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                    theme === 'system'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Mode Sistem"
            >
                <Monitor className="w-4 h-4" />
            </button>
            <button
                onClick={() => setTheme('dark')}
                className={`p-2 rounded-xl transition-all flex items-center justify-center ${
                    theme === 'dark'
                        ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600 dark:text-indigo-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Mode Gelap"
            >
                <Moon className="w-4 h-4" />
            </button>
        </div>
    );
}
