import type { Schema, Struct } from '@strapi/strapi';

export interface SharedChecklistItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_checklist_items';
  info: {
    displayName: 'Checklist Item';
    icon: 'check';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedImageTextBlock extends Struct.ComponentSchema {
  collectionName: 'components_shared_image_text_blocks';
  info: {
    displayName: 'Image Text Block';
    icon: 'picture';
  };
  attributes: {
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
    image: Schema.Attribute.Media<'images'> & Schema.Attribute.Required;
  };
}

export interface SharedListItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_list_items';
  info: {
    displayName: 'List Item';
    icon: 'bulletList';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedRichTextBlock extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_text_blocks';
  info: {
    displayName: 'Rich Text Block';
    icon: 'align-left';
  };
  attributes: {
    body: Schema.Attribute.RichText & Schema.Attribute.Required;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedSocialLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_social_links';
  info: {
    displayName: 'Social Link';
    icon: 'link';
  };
  attributes: {
    platform: Schema.Attribute.Enumeration<
      ['Instagram', 'TikTok', 'Facebook']
    > &
      Schema.Attribute.Required;
    url: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SharedStep extends Struct.ComponentSchema {
  collectionName: 'components_shared_steps';
  info: {
    displayName: 'Step';
    icon: 'arrowRight';
  };
  attributes: {
    body: Schema.Attribute.Text & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.checklist-item': SharedChecklistItem;
      'shared.image-text-block': SharedImageTextBlock;
      'shared.list-item': SharedListItem;
      'shared.rich-text-block': SharedRichTextBlock;
      'shared.social-link': SharedSocialLink;
      'shared.step': SharedStep;
    }
  }
}
