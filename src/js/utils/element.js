var createdElements = [];

export default function el(selector, parent = document, fallbackToEmpty = false, relaxedCleanup = false) {
  const removeListenersCallbacks = [];
  var e = typeof selector === 'string' ? parent.querySelector(selector) : selector;
  var found = true;

  if (!e) {
    found = false;
    if (!fallbackToEmpty) {
      throw new Error(`Ops! There is no DOM element matching "${ selector }" selector.`);
    } else {
      e = document.createElement('div');
    }
  }

  const registerEventListener = (type, callback) => {
    e.addEventListener(type, callback);

    const removeListener = () => e.removeEventListener(type, callback);

    removeListenersCallbacks.push(removeListener);
    return removeListener;
  };

  const api = {
    e,
    found() {
      return found;
    },
    content(str) {
      if (!str) {
        return e.innerHTML;
      }
      removeListenersCallbacks.forEach(c => c());
      e.innerHTML = str;
      return this.exports();
    },
    text(str) {
      if (!str) {
        return e.innerText;
      }
      e.innerText = str;
      return str;
    },
    appendChild(child) {
      e.appendChild(child);
      return this;
    },
    appendChildren(children) {
      children.forEach(c => e.appendChild(c.e));
      return this;
    },
    css(prop, value) {
      if (typeof value !== 'undefined') {
        e.style[prop] = value;
        return this;
      }
      return e.style[prop];
    },
    clearCSS() {
      e.style = {};
      return this;
    },
    prop(name, value) {
      if (typeof value !== 'undefined') {
        e[name] = value;
        return this;
      }
      return e[name];
    },
    attr(attr, value) {
      if (typeof value !== 'undefined') {
        e.setAttribute(attr, value);
        return this;
      }
      return e.getAttribute(attr);
    },
    onClick(callback) {
      return registerEventListener('click', callback);
    },
    onKeyUp(callback) {
      return registerEventListener('keyup', callback);
    },
    onKeyDown(callback) {
      return registerEventListener('keydown', callback);
    },
    onMouseOver(callback) {
      return registerEventListener('mouseover', callback);
    },
    onMouseOut(callback) {
      return registerEventListener('mouseout', callback);
    },
    onMouseUp(callback) {
      return registerEventListener('mouseup', callback);
    },
    onRightClick(callback) {
      const handler = event => {
        event.preventDefault();
        callback();
      };

      e.addEventListener('contextmenu', handler);

      const removeListener = () => e.removeEventListener('oncontextmenu', handler);

      removeListenersCallbacks.push(removeListener);
      return removeListener;
    },
    onChange(callback) {
      e.addEventListener('change', () => callback(e.value));

      const removeListener = () => e.removeEventListener('change', callback);

      removeListenersCallbacks.push(removeListener);
      return removeListener;
    },
    find(selector) {
      return el(selector, e);
    },
    appendTo(parent) {
      parent.e.appendChild(e);
    },
    exports() {
      return Array
        .prototype.slice.call(e.querySelectorAll('[data-export]'))
        .map(element => el(element, e));
    },
    namedExports() {
      return this.exports().reduce((result, exportedElement) => {
        result[exportedElement.attr('data-export')] = exportedElement;
        return result;
      }, {});
    },
    detach() {
      if (e.parentNode && e.parentNode.contains(e)) {
        e.parentNode.removeChild(e);
      }
    },
    empty() {
      while (e.firstChild) {
        e.removeChild(e.firstChild);
      }
      return this;
    },
    destroy() {
      removeListenersCallbacks.forEach(c => c());
      if (!relaxedCleanup) {
        this.empty();
        this.detach();
      }
    },
    scrollToBottom() {
      e.scrollTop = e.scrollHeight;
    },
    selectOnClick() {
      const removeListener = this.onClick(() => {
        e.select();
        removeListener();
      });
    }
  };

  createdElements.push(api);

  return api;
}

el.fromString = str => {
  const node = document.createElement('div');

  node.innerHTML = str;

  const filteredNodes = Array.prototype.slice.call(node.childNodes).filter(node => node.nodeType === 1);

  if (filteredNodes.length > 0) {
    return el(filteredNodes[0]);
  }
  throw new Error('fromString accepts HTMl with a single parent.');
};
el.wrap = elements => el(document.createElement('div')).appendChildren(elements);
el.fromTemplate = selector => el.fromString(document.querySelector(selector).innerHTML);
el.withFallback = selector => el(selector, document, true);
el.withRelaxedCleanup = selector => el(selector, document, false, true);
el.destroy = () => {
  createdElements.forEach(elInstance => elInstance.destroy());
  createdElements = [];
};
el.exists = (selector) => {
  return !!document.querySelector(selector);
};
