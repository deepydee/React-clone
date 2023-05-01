
const api = {
  get(url) {
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
                favorite: true,
              },
              {
                id: 2,
                name: 'Orange',
                description: 'Orange description',
                price: 41,
                favorite: false,
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
  },
  post(url) {
    if (/^\/lots\/(\d+)\/favorite$/.exec(url)) {
      return new Promise ((resolve) => {
        setTimeout(() => {
          resolve({})
        }, 500);
      });
    }

    if (/^\/lots\/(\d+)\/unfavorite$/.exec(url)) {
      return new Promise ((resolve) => {
        setTimeout(() => {
          resolve({})
        }, 500);
      });
    }

    throw new Error('Unknown address');
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

const clockInitialState = {
  time: new Date(),
};

const SET_TIME = 'SET_TIME';

const auctionInitialState = {
  lots: null,
};

const SET_LOTS = 'SET_LOTS';
const CHANGE_LOT_PRICE = 'CHANGE_LOT_PRICE';
const FAVORITE_LOT = 'FAVORITE_LOT';
const UNFAVORITE_LOT = 'UNFAVORITE_LOT';

function clockReducer(state = clockInitialState, action) {
  switch (action.type) {
    case SET_TIME:
      return {
        ...state,
        time: action.time
      }
    default:
      return state;
  }
}

function auctionReducer(state = auctionInitialState, action) {
  switch (action.type) {
    case SET_LOTS:
      return {
        ...state,
        lots: action.lots
      }
    case CHANGE_LOT_PRICE:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.id) {
            return {
              ...lot,
              price: action.price,
            }
          }

          return lot;
        }),
      }
    case FAVORITE_LOT:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.id) {
            return {
              ...lot,
              favorite: true
            }
          }

          return lot;
        })
      }
    case UNFAVORITE_LOT:
      return {
        ...state,
        lots: state.lots.map((lot) => {
          if (lot.id === action.id) {
            return {
              ...lot,
              favorite: false
            }
          }

          return lot;
        })
      }
    default:
      return state;
  }
}

// Action creators
const setTime = (time) => ({
  type: SET_TIME,
  time
});

const setLots = (lots) => ({
  type: SET_LOTS,
  lots
});

const changeLotPrice = (id, price) => ({
  type: CHANGE_LOT_PRICE,
  id,
  price
});

const favoriteLot = (id) => ({
  type: FAVORITE_LOT,
  id
});

const unfavoriteLot = (id) => ({
  type: UNFAVORITE_LOT,
  id
});

// ###########################


function App({ state, favorite, unfavorite }) {
  return (
    <div className="app">
      <Header />
      <Clock time={state.clock.time} />
      <Lots
        lots={state.auction.lots}
        favorite={favorite}
        unfavorite={unfavorite}
      />

      <LotsTable
        lots={state.auction.lots}
        favorite={favorite}
        unfavorite={unfavorite}
      />
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

function Lots({ lots, favorite, unfavorite }) {
  if (lots === null) {
    return <Loading />
  }

  return (
    <div className="lots">
      {lots.map((lot) =>
        <Lot lot={lot} favorite={favorite} unfavorite={unfavorite} key={lot.id} />)}
    </div>
  )
}

function LotsTable({ lots, favorite, unfavorite }) {
  if (lots === null) {
    return <Loading />
  }

  return (
    <table width="100%" cellPadding="10px">
      <tbody>
        {lots.map((lot) => (
          <tr key={lot.id} style={{background: lot.favorite ? '#ffd7cb' : '#fff'}}>
            <td>{lot.name}</td>
            <td>{lot.price}</td>
            <td>
              <Favorite
                active={lot.favorite}
                favorite={() => favorite(lot.id)}
                unfavorite={() => unfavorite(lot.id)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Lot({ lot, favorite, unfavorite }) {
  return (
    <article className={'lot' + (lot.favorite ? ' favorite': '')}>
      <div className="price">{lot.price}</div>
      <h1>{lot.name}</h1>
      <p>{lot.description}</p>
      <Favorite
        active={lot.favorite}
        id={lot.id}
        favorite={() => favorite(lot.id)}
        unfavorite={() => unfavorite(lot.id)}
      />
    </article>
  )
}

function Favorite({ active, favorite, unfavorite }) {
  return active
    ? (
    <button
      type="button"
      onClick={unfavorite}
      className="btn unfavorite"
    >
    <ion-icon name="heart-sharp"></ion-icon> Unfavorite
      </button>
      )
    : (
    <button
    type="button"
    onClick={favorite}
    className="btn favorite"
    >
    <ion-icon name="heart-outline"></ion-icon> Favorite
    </button>
    )
}

// ###########################

function renderView(store) {
  const state = store.getState();

  const favorite = (id) => {
    api.post(`/lots/${id}/favorite`)
      .then(() => {
        store.dispatch(favoriteLot(id));
      });
  }

  const unfavorite = (id) => {
    api.post(`/lots/${id}/unfavorite`)
      .then(() => {
        store.dispatch(unfavoriteLot(id));
      });
  }

  ReactDOM.render(
    <App
      state={state}
      favorite={favorite}
      unfavorite={unfavorite}
    />,
    document.getElementById('root'),
  );
}

const store = new Redux.createStore(Redux.combineReducers({
  clock: clockReducer,
  auction: auctionReducer,
}));

renderView(store);

store.subscribe(() => renderView(store));

setInterval(() => {
  store.dispatch(setTime(new Date()));
}, 1000);

api.get('/lots')
    //.finally(() => alert("Загрузка завершена"))
    .then((lots) => {

    store.dispatch(setLots(lots));

    lots.forEach((lot) => {
      stream.subscribe(`price-${lot.id}`, (data) => {
        store.dispatch(changeLotPrice(data.id, data.price));
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
