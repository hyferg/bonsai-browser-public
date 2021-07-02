import React, { useEffect, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import styled, { css } from 'styled-components';
import { ipcRenderer } from 'electron';
import { useStore } from './data';
import Tab from './components/Tab';
import TabObject from './interfaces/tab';
import plusIcon from '../assets/plus.svg';
import backIcon from '../assets/arrow-back.svg';
import refreshIcon from '../assets/refresh.svg';

const TitleBarFull = styled.div`
  width: 100vw;
  height: 100vh;
  background-color: red;
`;

const TitleBarTop = styled.div`
  -webkit-app-region: drag;
  -webkit-user-select: none;
  width: calc(100% - 16px);
  height: 32px;
  background-color: #dee1e6;
  display: flex;
  //flex-wrap: wrap;
  overflow: hidden;
  align-content: baseline;
  padding-top: 10px;
  padding-left: 6px;
  padding-right: 10px;
`;

const TitleBarBottom = styled.div`
  width: calc(100% - 4px);
  height: 36px;
  background-color: white;
  border-bottom: 1px solid #dee1e6;
  display: flex;
  align-items: center;
  align-content: center;
  padding-left: 4px;
  overflow: hidden;
`;

// const RoundButton = styled.div`
//   width: 28px;
//   height: 28px;
//   background-color: gray;
//   border-radius: 50%;
//   margin-left: 2px;
//   flex-shrink: 0;
// `;

interface StyledRoundButtonProps {
  color: string;
}

const RoundButton = styled.div`
  -webkit-app-region: no-drag;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 50%;
  margin-left: 2px;

  ${({ color }: StyledRoundButtonProps) =>
    css`
      background-color: ${color};
    `}
`;

const RoundButtonIcon = styled.img`
  -webkit-user-drag: none;
  width: 20px;
`;

const RoundButtonIconFlipped = styled.img`
  -webkit-user-drag: none;
  width: 20px;
  transform: rotate(180deg);
`;

const NewTabButtonParent = styled.div`
  -webkit-app-region: no-drag;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 28px;
  height: 28px;
  border: none;
  background-color: #82dbff;
  border-radius: 50%;
  margin-left: 7px;
  margin-top: 1px;
  margin-right: 100px;
`;

const NewTabButtonIcon = styled.img`
  -webkit-user-drag: none;
`;

const URLBox = styled.input`
  flex-grow: 1;
  margin-left: 10px;
  border-radius: 10000000px;
  outline: none;
  border: 2px solid black;
  padding-left: 10px;
  margin-right: 10px;
  height: 22px;
`;

const TitleBar = observer(() => {
  const { tabStore } = useStore();
  const urlBoxRef = useRef<HTMLInputElement>(null);

  const [addedDefaultTab, setAddedDefaultTab] = useState(false);
  const [urlFocus, setUrlFocus] = useState(false);

  let canGoBack = false;
  let canGoForward = false;

  if (tabStore.activeTabId !== -1) {
    ({ canGoBack, canGoForward } = tabStore.tabs[
      tabStore.getTabIndex(tabStore.activeTabId)
    ]);
  }

  useEffect(() => {
    if (addedDefaultTab) {
      return;
    }
    setAddedDefaultTab(true);
    tabStore.addTab();
    tabStore.setActiveTabSearchBar('https://www.google.com');
    ipcRenderer.send('load-url-in-tab', [
      tabStore.activeTabId,
      tabStore.getActiveTabSearchBar(),
    ]);
  }, [addedDefaultTab, tabStore]);

  return (
    <TitleBarFull>
      <TitleBarTop>
        {tabStore.tabs.map((tab: TabObject) => (
          <Tab key={tab.id} tab={tab} />
        ))}
        <NewTabButtonParent
          onClick={() => {
            tabStore.addTab();
            if (urlBoxRef.current != null) {
              urlBoxRef.current.focus();
            }
          }}
        >
          <NewTabButtonIcon src={plusIcon} />
        </NewTabButtonParent>
      </TitleBarTop>
      <TitleBarBottom>
        <RoundButton color={canGoBack ? '#949494' : '#e3e3e3'}>
          <RoundButtonIcon
            src={backIcon}
            onClick={() => {
              ipcRenderer.send('tab-back', tabStore.activeTabId);
            }}
          />
        </RoundButton>
        <RoundButton color={canGoForward ? '#949494' : '#e3e3e3'}>
          <RoundButtonIconFlipped
            src={backIcon}
            onClick={() => {
              ipcRenderer.send('tab-forward', tabStore.activeTabId);
            }}
          />
        </RoundButton>
        <RoundButton color="#949494">
          <RoundButtonIcon
            src={refreshIcon}
            onClick={() => {
              ipcRenderer.send('tab-refresh', tabStore.activeTabId);
              tabStore.setActiveTabSearchBar(
                tabStore.tabs[tabStore.getTabIndex(tabStore.activeTabId)].url
              );
            }}
          />
        </RoundButton>
        <URLBox
          type="text"
          ref={urlBoxRef}
          placeholder="Search Google or type a URL"
          value={tabStore.getActiveTabSearchBar()}
          onInput={(e) => {
            if (tabStore.activeTabId === -1) {
              tabStore.addTab();
            }
            tabStore.setActiveTabSearchBar(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            if (e.nativeEvent.code === 'Enter') {
              const searchText = tabStore.getActiveTabSearchBar();
              if (searchText !== '') {
                ipcRenderer.send('load-url-in-tab', [
                  tabStore.activeTabId,
                  searchText,
                ]);
              }
            }
          }}
          onClick={() => {
            if (urlBoxRef.current != null && !urlFocus) {
              setUrlFocus(true);
              urlBoxRef.current.select();
            }
          }}
          onBlur={() => {
            setUrlFocus(false);
            if (urlBoxRef.current != null) {
              urlBoxRef.current.blur();
              window.getSelection()?.removeAllRanges();
            }
          }}
        />
      </TitleBarBottom>
    </TitleBarFull>
  );
});

export default TitleBar;
