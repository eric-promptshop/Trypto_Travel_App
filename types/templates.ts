// Template System Types

export interface TemplateComponent {
  id: string;
  type: ComponentType;
  name: string;
  description: string;
  props: Record<string, any>;
  children?: TemplateComponent[];
  styles?: ComponentStyles;
  isRequired?: boolean;
  isCustomizable?: boolean;
  order: number;
}

export type ComponentType =
  | 'header'
  | 'footer' 
  | 'hero'
  | 'navigation'
  | 'content-block'
  | 'sidebar'
  | 'feature-grid'
  | 'testimonials'
  | 'cta-section'
  | 'gallery'
  | 'form'
  | 'spacer'
  | 'divider'
  | 'custom';

export interface ComponentStyles {
  layout?: {
    width?: string;
    maxWidth?: string;
    minWidth?: string;
    height?: string;
    minHeight?: string;
    maxHeight?: string;
    padding?: string;
    margin?: string;
    display?: 'block' | 'flex' | 'grid' | 'none';
    flexDirection?: 'row' | 'column';
    justifyContent?: string;
    alignItems?: string;
    gap?: string;
    position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: number;
  };
  appearance?: {
    backgroundColor?: string;
    backgroundImage?: string;
    backgroundSize?: string;
    backgroundPosition?: string;
    borderRadius?: string;
    border?: string;
    borderTop?: string;
    borderRight?: string;
    borderBottom?: string;
    borderLeft?: string;
    boxShadow?: string;
    opacity?: number;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    color?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  };
  responsive?: {
    mobile?: Partial<ComponentStyles>;
    tablet?: Partial<ComponentStyles>;
    desktop?: Partial<ComponentStyles>;
  };
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  version: string;
  thumbnail?: string;
  previewImages: string[];
  components: TemplateComponent[];
  settings: TemplateSettings;
  metadata: TemplateMetadata;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export type TemplateCategory = 
  | 'landing-page'
  | 'product-page'
  | 'about-page'
  | 'contact-page'
  | 'blog-page'
  | 'custom-page';

export interface TemplateSettings {
  layout: {
    maxWidth: string;
    containerSpacing: string;
    sectionSpacing: string;
  };
  responsive: {
    breakpoints: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
    stackingOrder: ComponentType[];
  };
  seo: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  accessibility: {
    skipLinks: boolean;
    ariaLabels: Record<string, string>;
    focusManagement: boolean;
  };
}

export interface TemplateMetadata {
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number; // in minutes
  features: string[];
  compatibility: {
    devices: ('mobile' | 'tablet' | 'desktop')[];
    browsers: string[];
  };
  documentation?: string;
}

// Client-specific template instance
export interface TemplateInstance {
  id: string;
  templateId: string;
  clientId: string;
  name: string;
  configuration: TemplateConfiguration;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: string;
  publishedBy?: string;
  url?: string;
  customDomain?: string;
}

export interface TemplateConfiguration {
  components: ConfiguredComponent[];
  globalSettings: TemplateSettings;
  customizations: TemplateCustomizations;
}

export interface ConfiguredComponent extends TemplateComponent {
  isVisible: boolean;
  customContent?: Record<string, any>;
  customStyles?: ComponentStyles;
  assetMappings?: Record<string, string>; // Maps placeholder assets to client assets
}

export interface TemplateCustomizations {
  theme: {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: Record<string, string>;
  };
  content: {
    brandName: string;
    tagline?: string;
    contactInfo?: ContactInfo;
    socialLinks?: SocialLink[];
    customSections?: CustomSection[];
  };
  assets: {
    logo?: string;
    favicon?: string;
    heroImage?: string;
    backgroundImages?: string[];
    customImages?: Record<string, string>;
  };
}

export interface ContactInfo {
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'custom';
  url: string;
  label: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  position: 'before' | 'after';
  targetComponentId: string;
}

// Template editor interfaces
export interface TemplateEditor {
  currentTemplate: TemplateInstance | null;
  selectedComponent: string | null;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  isEditing: boolean;
  isDirty: boolean;
  history: TemplateHistoryState[];
  historyIndex: number;
}

export interface TemplateHistoryState {
  id: string;
  timestamp: string;
  action: string;
  configuration: TemplateConfiguration;
}

// Component library types
export interface ComponentLibrary {
  categories: ComponentCategory[];
  components: ComponentDefinition[];
}

export interface ComponentCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

export interface ComponentDefinition {
  id: string;
  type: ComponentType;
  categoryId: string;
  name: string;
  description: string;
  icon: string;
  thumbnail: string;
  defaultProps: Record<string, any>;
  configurableProps: PropDefinition[];
  styleOptions: StyleOptionGroup[];
  examples: ComponentExample[];
  documentation?: string;
}

export interface PropDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'number' | 'color' | 'asset' | 'rich-text';
  required: boolean;
  defaultValue: any;
  options?: SelectOption[];
  validation?: ValidationRule[];
  help?: string;
}

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
}

export interface StyleOptionGroup {
  id: string;
  label: string;
  options: StyleOption[];
}

export interface StyleOption {
  key: string;
  label: string;
  type: 'color' | 'spacing' | 'typography' | 'border' | 'shadow' | 'background';
  control: 'slider' | 'input' | 'select' | 'color-picker' | 'toggle';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: SelectOption[];
}

export interface ComponentExample {
  id: string;
  name: string;
  description: string;
  props: Record<string, any>;
  styles?: ComponentStyles;
  preview: string;
}

// Template API types
export interface TemplateListResponse {
  templates: TemplateDefinition[];
  totalCount: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TemplateInstanceResponse {
  success: boolean;
  instance?: TemplateInstance;
  error?: string;
}

export interface TemplatePublishRequest {
  instanceId: string;
  publishSettings: {
    customDomain?: string;
    seoSettings?: TemplateSettings['seo'];
    environmentVariables?: Record<string, string>;
  };
}

export interface TemplatePublishResponse {
  success: boolean;
  url?: string;
  deploymentId?: string;
  error?: string;
}

// Template validation types
export interface TemplateValidationResult {
  isValid: boolean;
  errors: TemplateValidationError[];
  warnings: TemplateValidationWarning[];
}

export interface TemplateValidationError {
  type: 'missing-required-prop' | 'invalid-prop-value' | 'missing-asset' | 'invalid-configuration';
  componentId?: string;
  propKey?: string;
  message: string;
  suggestions?: string[];
}

export interface TemplateValidationWarning {
  type: 'accessibility' | 'performance' | 'seo' | 'compatibility';
  componentId?: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  suggestions?: string[];
}

// Default template configurations
export const DEFAULT_TEMPLATE_SETTINGS: TemplateSettings = {
  layout: {
    maxWidth: '1200px',
    containerSpacing: '2rem',
    sectionSpacing: '4rem',
  },
  responsive: {
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1280,
    },
    stackingOrder: ['header', 'hero', 'content-block', 'footer'],
  },
  seo: {
    title: '',
    description: '',
    keywords: [],
  },
  accessibility: {
    skipLinks: true,
    ariaLabels: {},
    focusManagement: true,
  },
};

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    id: 'layout',
    name: 'Layout',
    description: 'Structural components for page layout',
    icon: 'layout',
    order: 1,
  },
  {
    id: 'content',
    name: 'Content',
    description: 'Components for displaying content',
    icon: 'type',
    order: 2,
  },
  {
    id: 'media',
    name: 'Media',
    description: 'Image, video, and gallery components',
    icon: 'image',
    order: 3,
  },
  {
    id: 'forms',
    name: 'Forms',
    description: 'Interactive form components',
    icon: 'form-input',
    order: 4,
  },
  {
    id: 'navigation',
    name: 'Navigation',
    description: 'Navigation and menu components',
    icon: 'navigation',
    order: 5,
  },
]; 