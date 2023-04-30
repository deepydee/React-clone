
const api = {
  get (url) {
    switch (url) {
      case '/lots':
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve([
              {
                id: 1,
                name: 'Apple',
                description: 'Apple description',
                price: 16,
              },
              {
                id: 2,
                name: 'Orange',
                description: 'Orange description',
                price: 41,
              },
            ]);

            reject(
              new Error("Unknown address")
            )
          }, 3000);
        });

      default:
        throw new Error('Unknown address')
    }
  }
};

const stream = {
  subscribe (channel, listener) {
    const match = /price-(\d+)/.exec(channel);

    if (match) {
      setInterval(() => {
        listener({
          id: parseInt(match[1]),
          price: Math.round((Math.random() * 10 + 30))
        })
      }, 1000);
    }
  }
};

// ###########################

const initialState = {
  time: new Date(),
  lots: null,
};

class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = [];
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.push(listener);

    return () => {
      const index = this.listeners.indexOf(listener);
      this.listeners.splice(index, 1);
    }
  }

  setState(state) {
    this.state = typeof state === 'function'
        ? state(this.state)
        : state

    this.listeners.forEach((listener) => listener());
  }
}

const store = new Store(initialState);

function App({ state }) {
  return (
    <div className="app">
      <Header />
      <Clock time={state.time} />
      <Lots lots={state.lots} />
    </div>
  )
}

function Header() {
  return (
  <header className="header">
    <Logo />
  </header>
  )
}

function Logo() {
  return <img className="logo" src="logo.png" alt="" />
}

function Clock({ time }) {
  const isDay = time.getHours() >= 7 && time.getHours() <= 21;

  return (
    <div className="clock">
      <span className="value">{time.toLocaleTimeString()}</span>
      <span className={isDay ? 'icon day' : 'icon night'}></span>
    </div>
  )
}

function Loading() {
  return <div className="loading">Loading...</div>
}

function Lots({ lots }) {
  if (lots === null) {
    return <Loading />
  }

  return (
    <div className="lots">
      {lots.map((lot) => <Lot lot={lot} key={lot.id} />)}
    </div>
  )
}

function Lot({ lot }) {
  return (
    <article className="lot">
      <div className="price">{lot.price}</div>
      <h1>{lot.name}</h1>
      <p>{lot.description}</p>
    </article>
  )
}

// ###########################
function renderView(state) {
  ReactDOM.render(
    <App state={state} />,
    document.getElementById('root'),
  );
}

renderView(store.getState());

store.subscribe(() => renderView(store.getState()));

function setTime(state, params) {
  return {
    ...state,
    time: params.time
  }
}

function setLots(state, params) {
  return {
    ...state,
    lots: params.lots
  }
}

function changeLotPrice (state, params) {
  return {
    ...state,
    lots: state.lots.map((lot) => {
      if (lot.id === params.id) {
        return {
          ...lot,
          price: params.price,
        }
      }

      return lot;
    }),
  }
}

setInterval(() => {
  store.setState((state) => setTime(state, { time: new Date() }));
}, 1000);

api.get('/lots')
    //.finally(() => alert("Загрузка завершена"))
    .then((lots) => {
      store.setState((state) => setLots(state, { lots }));

      lots.forEach((lot) => {
        stream.subscribe(`price-${lot.id}`, (data) => {
          store.setState((state) => changeLotPrice(state,
            { id: data.id,
              price: data.price
            }
          ));
        });
      });

    })

    .catch((err) => console.log(err)
);

function render (virtualDom, realDomRoot) {
  const evaluatedVirtualDom = evaluate(virtualDom);

  const virtualDomRoot = {
    type: realDomRoot.tagName.toLowerCase(),
    props: {
      id: realDomRoot.id,
      ...realDomRoot.attributes,
      children: [
        evaluatedVirtualDom
      ]
    }
  }

  sync(virtualDomRoot, realDomRoot);
}

function evaluate(virtualNode) {
  if (typeof virtualNode !== 'object') {
    return virtualNode;
  }

  if (typeof virtualNode.type === 'function') {
    return evaluate((virtualNode.type)(virtualNode.props));
  }

  const props = virtualNode.props || {};

  return {
    ...virtualNode,
    props: {
      ...props,
      children: Array.isArray(props.children)
        ? props.children.map(evaluate)
        : [evaluate(props.children)]
    }
  }
}

function sync(virtualNode, realNode) {
  // sync element

  if (virtualNode.props) {
    Object.entries(virtualNode.props).forEach(([name, value]) => {
      if (name === 'children' && name === 'key') {
        return;
      }

      if (realNode[name] !== value) {
         realNode[name] = value
      }
    });
  }

  if (virtualNode.key) {
    realNode.dataset.key = virtualNode.key;
  }

  if (typeof virtualNode !== 'object' && virtualNode !== realNode.nodeValue) {
    realNode.nodeValue = virtualNode;
  }

  // sync child nodes
  const virtualChildren = virtualNode.props
    ? virtualNode.props.children || []
    : [];
  const realChildren = realNode.childNodes;

  for (let i = 0; i < virtualChildren.length || i < realChildren.length; i++) {
    const virtual = virtualChildren[i];
    const real = realChildren[i];

    // Remove
    if (!virtual && real) {
      realNode.remove(real);
    }

    // Update
    if (virtual && real && (virtual.type || '') === (real.tagName || '').toLowerCase()) {
      sync(virtual, real);
    }

    // Replace
    if (virtual && real && (virtual.type || '') !== (real.tagName || '').toLowerCase()) {
      const newReal = createRealNodeByVirtual(virtual);
      sync(virtual, newReal);
      real.replaceWith(newReal);
    }

    // Add
    if (virtual && !real) {
      const newReal = createRealNodeByVirtual(virtual);
      sync(virtual, newReal);
      realNode.append(newReal);
    }
  }
}

function createRealNodeByVirtual(virtual) {
  if (typeof virtual !== 'object') {
    return document.createTextNode('');
  }

  return document.createElement(virtual.type);
}
