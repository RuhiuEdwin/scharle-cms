import type { StrapiApp } from '@strapi/strapi/admin';
import AuthLogo from './extensions/auth-logo.png';
import MenuLogo from './extensions/menu-logo.png';
import Favicon from './extensions/favicon.png';

// Strapi's default homepage widgets (guided tour, "Deploy to Strapi Cloud")
// have no documented removal API, and their only known workaround targets
// styled-components' auto-generated classnames — those aren't stable across
// dependency bumps. Scrubbing rendered text instead: durable as long as
// Strapi's own UI copy still literally says "Strapi", regardless of how
// their internal markup/classnames change.
function scrubStrapiText(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent && node.textContent.includes('Strapi')) {
      node.textContent = node.textContent
        .replace(/Strapi Cloud/g, 'Scharle CMS')
        .replace(/Strapi/g, 'Scharle CMS');
    }
  }
}

export default {
  config: {
    auth: {
      logo: AuthLogo,
    },
    menu: {
      logo: MenuLogo,
    },
    head: {
      favicon: Favicon,
    },
    translations: {
      en: {
        'Auth.form.welcome.title': 'Welcome to Scharle CMS',
        'Auth.form.welcome.subtitle': 'Log in to manage Scharle Beauty College',
        'app.components.LeftMenu.navbrand.title': 'Scharle CMS',
        'app.components.LeftMenu.navbrand.workplace': 'Beauty College',
      },
    },
    tutorials: false,
    notifications: {
      releases: false,
    },
    locales: [],
  },
  bootstrap(app: StrapiApp) {
    document.title = 'Scharle CMS';
    scrubStrapiText(document.body);

    const titleEl = document.querySelector('title');
    if (titleEl) {
      new MutationObserver(() => {
        if (document.title.includes('Strapi')) {
          document.title =
            document.title.replace(/\s*\|\s*Strapi/, '').trim() || 'Scharle CMS';
        }
      }).observe(titleEl, { childList: true });
    }

    new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((added) => scrubStrapiText(added));
      }
    }).observe(document.body, { childList: true, subtree: true });
  },
};
