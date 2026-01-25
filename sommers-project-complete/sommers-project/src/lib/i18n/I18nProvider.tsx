/**
 * I18n Provider
 * Internationalization context for multi-language support
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type Language = 'en' | 'es' | 'fr';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'MXN';

interface I18nState {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string, format?: string) => string;
  formatNumber: (num: number) => string;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.create': 'Create',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.proposals': 'Proposals',
    'nav.clients': 'Clients',
    'nav.pipeline': 'Pipeline',
    'nav.scheduling': 'Scheduling',
    'nav.templates': 'Templates',
    'nav.discounts': 'Discounts',
    'nav.analytics': 'Analytics',
    'nav.settings': 'Settings',
    
    // Proposals
    'proposals.new': 'New Proposal',
    'proposals.status.draft': 'Draft',
    'proposals.status.sent': 'Sent',
    'proposals.status.viewed': 'Viewed',
    'proposals.status.accepted': 'Accepted',
    'proposals.status.rejected': 'Rejected',
    
    // Services
    'services.sealcoating': 'Sealcoating',
    'services.crackFilling': 'Crack Filling',
    'services.lineStriping': 'Line Striping',
    'services.potholeRepair': 'Pothole Repair',
  },
  es: {
    // Common
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.create': 'Crear',
    'common.search': 'Buscar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.proposals': 'Propuestas',
    'nav.clients': 'Clientes',
    'nav.pipeline': 'Pipeline',
    'nav.scheduling': 'Programación',
    'nav.templates': 'Plantillas',
    'nav.discounts': 'Descuentos',
    'nav.analytics': 'Analíticas',
    'nav.settings': 'Configuración',
    
    // Proposals
    'proposals.new': 'Nueva Propuesta',
    'proposals.status.draft': 'Borrador',
    'proposals.status.sent': 'Enviado',
    'proposals.status.viewed': 'Visto',
    'proposals.status.accepted': 'Aceptado',
    'proposals.status.rejected': 'Rechazado',
    
    // Services
    'services.sealcoating': 'Sellado',
    'services.crackFilling': 'Relleno de Grietas',
    'services.lineStriping': 'Señalización',
    'services.potholeRepair': 'Reparación de Baches',
  },
  fr: {
    // Common
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.create': 'Créer',
    'common.search': 'Rechercher',
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.proposals': 'Propositions',
    'nav.clients': 'Clients',
    'nav.pipeline': 'Pipeline',
    'nav.scheduling': 'Planification',
    'nav.templates': 'Modèles',
    'nav.discounts': 'Remises',
    'nav.analytics': 'Analytique',
    'nav.settings': 'Paramètres',
    
    // Proposals
    'proposals.new': 'Nouvelle Proposition',
    'proposals.status.draft': 'Brouillon',
    'proposals.status.sent': 'Envoyé',
    'proposals.status.viewed': 'Vu',
    'proposals.status.accepted': 'Accepté',
    'proposals.status.rejected': 'Rejeté',
    
    // Services
    'services.sealcoating': 'Scellement',
    'services.crackFilling': 'Remplissage des Fissures',
    'services.lineStriping': 'Marquage',
    'services.potholeRepair': 'Réparation de Nids-de-poule',
  },
};

// ============================================================================
// CONTEXT
// ============================================================================

const I18nContext = createContext<I18nState | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface I18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: I18nProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');
  const [currency, setCurrencyState] = useState<Currency>('USD');

  // Load from localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    const savedCurr = localStorage.getItem('currency') as Currency;
    
    if (savedLang && ['en', 'es', 'fr'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
    if (savedCurr && ['USD', 'EUR', 'GBP', 'CAD', 'MXN'].includes(savedCurr)) {
      setCurrencyState(savedCurr);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('currency', curr);
  };

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language]?.[key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    
    return text;
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    const localeMap: Record<Currency, string> = {
      USD: 'en-US',
      EUR: 'de-DE',
      GBP: 'en-GB',
      CAD: 'en-CA',
      MXN: 'es-MX',
    };
    
    return new Intl.NumberFormat(localeMap[currency], {
      style: 'currency',
      currency,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string, format?: string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const localeMap: Record<Language, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
    };
    
    return d.toLocaleDateString(localeMap[language], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format number
  const formatNumber = (num: number): string => {
    const localeMap: Record<Language, string> = {
      en: 'en-US',
      es: 'es-ES',
      fr: 'fr-FR',
    };
    
    return new Intl.NumberFormat(localeMap[language]).format(num);
  };

  const value: I18nState = {
    language,
    currency,
    setLanguage,
    setCurrency,
    t,
    formatCurrency,
    formatDate,
    formatNumber,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// ============================================================================
// HOOKS
// ============================================================================

export function useI18n(): I18nState {
  const context = useContext(I18nContext);
  
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  
  return context;
}

export function useTranslation() {
  const { t, language, setLanguage } = useI18n();
  return { t, language, setLanguage };
}

export default I18nContext;
