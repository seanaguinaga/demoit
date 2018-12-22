import el from './utils/element';
import { CLOSE_ICON, PLUS_ICON, SETTINGS_ICON, DOT_CIRCLE, NO_USER, FORK, FILE_ICON } from './utils/icons';
import { isProd } from './utils';

const STATUS_BAR_HIDDEN_HEIGHT = '6px';
const STATUS_BAR_VISIBLE_HEIGHT = '36px';

const showProfilePicAndName = profile => {
  return `<img src="${ profile.avatar }"/>`
};
const createStatusBarLink = (exportKey, label, className = '') => {
  return `<a data-export="${ exportKey }" class="${ className }" href="javascript:void(0)">${ label }</a>`;
}
const createStr = (str, n) => Array(n).join(str);

export default function statusBar(state, showFile, newFile, editFile, showSettings, showProfile, editName) {
  const bar = el.withRelaxedCleanup('.status-bar');
  const layout = el.withRelaxedCleanup('.app .layout');
  let visibility = !!state.getEditorSettings().statusBar;

  const render = () => {
    const items  = [];
    const files = state.getFiles();

    items.push('<div data-export="buttons">');
    isProd() && items.push(createStatusBarLink('profileButton', state.loggedIn() ? showProfilePicAndName(state.getProfile()) : NO_USER(), 'profile'));
    state.isForkable() && items.push(createStatusBarLink('forkButton', FORK(14)));
    files.forEach(({ filename, entryPoint }, idx) => {
      const isCurrentFile = state.isCurrentIndex(idx);

      items.push(createStatusBarLink(
        'file',
        `<span>${ filename }${ isCurrentFile && state.pendingChanges() ? '*' : ''}</span>`,
        `file${ isCurrentFile ? ' active' : '' }${ entryPoint ? ' entry' : ''}`
      ))
    });
    items.push(createStatusBarLink('newFileButton', PLUS_ICON(14), ''));
    items.push(createStatusBarLink('nameButton', state.name() ? state.name() : 'unnamed', 'name'));
    items.push(createStatusBarLink('settingsButton', SETTINGS_ICON(14)));
    items.push(createStatusBarLink('closeButton', CLOSE_ICON(14)));
    items.push('</div>');

    bar.content(items.join('')).reduce((index, button) => {
      if (button.attr('data-export') === 'file') {
        button.onClick(() => showFile(index));
        button.onRightClick(() => editFile(index));
        return index + 1;
      }
      return index;
    }, 0);

    const { newFileButton, closeButton, settingsButton, profileButton, forkButton, nameButton } = bar.namedExports();
    const manageVisibility = () => {
      const { buttons } = bar.namedExports();

      buttons.css('display', visibility ? 'grid' : 'none');
      buttons.css('gridTemplateColumns', [
        isProd() ? '34px' : false,
        state.isForkable() ? '30px' : false,
        createStr('minmax(auto, 135px) ', files.length + 1),
        '30px',
        '1fr',
        '30px',
        '30px',
      ].filter(value => value).join(' '));
      bar.css('height', visibility ? STATUS_BAR_VISIBLE_HEIGHT : STATUS_BAR_HIDDEN_HEIGHT);
      layout.css('height', visibility ? `calc(100% - ${ STATUS_BAR_VISIBLE_HEIGHT })` : `calc(100% - ${ STATUS_BAR_HIDDEN_HEIGHT })`);
      state.updateStatusBarVisibility(visibility);
    }

    newFileButton && newFileButton.onClick(newFile);
    settingsButton && settingsButton.onClick(showSettings);
    profileButton && profileButton.onClick(showProfile);
    nameButton && nameButton.onClick(editName);
    forkButton && forkButton.onClick(() => state.fork());
    closeButton.onClick(e => {
      e.stopPropagation();
      visibility = false;
      manageVisibility();
    });
    bar.onClick(() => {
      if (!visibility) {
        visibility = true;
        manageVisibility();
      }
    });

    manageVisibility();
  }

  render();

  state.listen(render);
}