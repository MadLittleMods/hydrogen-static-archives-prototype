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
  TimelineView
} = require('hydrogen-view-sdk');

const events = require('./sample-test-messages.json').chunk;


// eslint-disable-next-line max-statements
function mountHydrogen() {

  const storedEvents = events.map((e, i) => { return {event: e, eventIndex: i, fragmentId: 1}});
  const entries = storedEvents.map(se => new EventEntry(se, undefined));
  const list = new ObservableArray(entries);
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
  
const roomData = {
  name: "Room Foo",
  id: "!abc:hs.tld"
};
const me = RoomMember.fromUserId(roomData.id, "@awef:cawef.com");
const timeline = {
  dispose() {},
  entries: list,
  async loadAtTop() { return true;},
  me
};
const mediaRepository = new MediaRepository({
  homeserver: "https://hs.tld",
});
const room = {
  name: roomData.name,
  id: roomData.id,
  avatarUrl: roomData.avatarUrl,
  avatarColorId: roomData.id,
  mediaRepository: mediaRepository,
};
const timelineVM = new TimelineViewModel({
  timeline,
  tileOptions: {
    tileClassForEntry,
    timeline,
    urlCreator: {
      urlUntilSegment() { return "foo";}
    },
    roomVM: {room}
  }
});
const view = new TimelineView(timelineVM, viewClassForTile);
view.mount();
//timelineVM.setVisibleTileRange(tiles._tiles[0], tiles._tiles[3]);
const app = document.querySelector('#app');

app.appendChild(view.root());


  return app.innerHTML;
}

module.exports = mountHydrogen;
