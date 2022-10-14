'use strict';

const {
  Platform,
  MediaRepository,
  createNavigation,
  createRouter,
  RoomMember,
  TilesCollection,
  FragmentIdComparer,
  tileClassForEntry,
  viewClassForTile,
  EventEntry,
  encodeKey,
  encodeEventIdKey,
  Timeline,
  RoomViewModel,
  ViewModel,
  setupLightboxNavigation,
  ObservableArray,
  TimelineViewModel,
  TimelineView,
  createMemoryStorage,
  MockClock,
  Client,
  ConsoleLogger,
  LoadStatus,
  SyncStatus,
} = require('hydrogen-view-sdk');

const events = require('./sample-test-messages.json').chunk;

// eslint-disable-next-line max-statements
async function mountHydrogen() {
  let hasSynced = false;
  const platform = {
    clock: new MockClock(),
    random: Math.random,
    loadOlm() {},
    loadOlmWorker() {},
    storageFactory: {
      create(sessionId, logItem) {
        return createMemoryStorage();
      },
    },
    sessionInfoStorage: {
      add() {},
    },
    request(url, requestOptions) {
      console.log('request url', url);
      return {
        abort() {},
        async response() {
          if (url.endsWith('/sync?timeout=0&filter=1')) {
            if (hasSynced) {
              return {
                status: 200,
                body: {},
              };
            } else {
              hasSynced = true;
              return {
                status: 200,
                body: {
                  rooms: {
                    join: {
                      '!awef:awef.com': {
                        timeline: {
                          events: events,
                        },
                      },
                    },
                  },
                },
              };
            }
          }

          if (!hasSynced) {
            if (url.endsWith('/filter?')) {
              return {
                status: 200,
                body: {
                  filter_id: '1',
                },
              };
            } else if (url.endsWith('/versions?')) {
              return {
                status: 200,
                body: {
                  versions: [],
                },
              };
            }
          } else {
            // Stall the other requests
            return new Promise((resolve) => {});
          }

          return { status: 404, body: 'Stub not implemented' };
        },
      };
    },
  };

  const logger = new ConsoleLogger({ platform });
  platform.logger = logger;

  console.log('Client', Client);
  const client = new Client(platform);
  client.startWithAuthData({
    accessToken: 'fake',
    deviceId: 'fakedeviceId',
    userId: 'fakeUserId',
    homeserver: 'fakehomeserverUrl',
  });
  await client.loadStatus.waitFor((status) => {
    return status === LoadStatus.Ready || status === LoadStatus.Error;
  }).promise;

  // const storedEvents = events.map((e, i) => {
  //   return { event: e, eventIndex: i, fragmentId: 1 };
  // });
  // const entries = storedEvents.map((se) => new EventEntry(se, undefined));
  // const list = new ObservableArray(entries);

  //list.subscribe({ onAdd: () => null, onUpdate: () => null });
  // const tiles = new TilesCollection(list, {
  //   tileClassForEntry,
  //   platform: {},
  //   navigation: {},
  //   urlCreator: {},
  //   timeline: {},
  // });

  // tiles.subscribe({ onAdd: () => null, onUpdate: () => null });
  // console.log(tiles._tiles);

  // for (const t of tiles) {
  //   console.log(t.displayName);
  // }

  // const roomData = {
  //   name: 'Room Foo',
  //   id: '!abc:hs.tld',
  // };
  // const me = RoomMember.fromUserId(roomData.id, '@awef:cawef.com');

  // const timeline = {
  //   dispose() {},
  //   entries: list,
  //   async loadAtTop() {
  //     return true;
  //   },
  //   me,
  // };

  await client.sync.status.waitFor((s) => {
    return s === SyncStatus.Syncing;
  });

  const room = client.session.rooms.get('!awef:awef.com');
  const timeline = await room.openTimeline();

  // const mediaRepository = new MediaRepository({
  //   homeserver: 'https://hs.tld',
  // });
  // const room = {
  //   name: roomData.name,
  //   id: roomData.id,
  //   avatarUrl: roomData.avatarUrl,
  //   avatarColorId: roomData.id,
  //   mediaRepository: mediaRepository,
  // };

  const timelineVM = new TimelineViewModel({
    timeline,
    tileOptions: {
      tileClassForEntry,
      timeline,
      urlCreator: {
        urlUntilSegment() {
          return 'foo';
        },
      },
      roomVM: { room },
    },
  });
  const view = new TimelineView(timelineVM, viewClassForTile);
  view.mount();
  // timelineVM.setVisibleTileRange(
  //   timelineVM.tiles._tiles[0],
  //   timelineVM.tiles._tiles[timelineVM.tiles.length - 1]
  // );
  const app = document.querySelector('#app');

  app.appendChild(view.root());

  return app.innerHTML;
}

module.exports = mountHydrogen;
