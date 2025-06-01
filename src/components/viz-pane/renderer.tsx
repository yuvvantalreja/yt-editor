import * as React from 'react';
import {mapDispatchToProps, mapStateToProps} from './index.js';
import {EDITOR_FOCUS, LAYOUT, NAVBAR, WORD_SEPARATORS} from '../../constants/index.js';
import DataViewer from '../data-viewer/index.js';
import ErrorBoundary from '../error-boundary/index.js';
import ErrorPane from '../error-pane/index.js';
import Renderer from '../renderer/index.js';
import SignalViewer from '../signal-viewer/index.js';
import DebugPaneHeader from './debug-pane-header/index.js';
import './index.css';
import {version as VG_VERSION} from 'vega';
import {version as VL_VERSION} from 'vega-lite';
import {version as TOOLTIP_VERSION} from 'vega-tooltip';
import {COMMIT_HASH} from '../header/help-modal/index.js';
import {DataflowViewer} from '../../features/dataflow/DataflowViewer.js';
import Split from 'react-split';

const defaultState = {
  header: '',
  maxRange: 0,
  range: 0,
  splitSizes: [100, 0],
  lastNonZeroSize: 30,
};

type State = Readonly<typeof defaultState>;

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

export default class VizPane extends React.PureComponent<Props, State> {
  constructor(props) {
    super(props);
    const debugPanePercentage = props.debugPane
      ? Math.min(Math.max((props.debugPaneSize / window.innerHeight) * 100, 20), 50)
      : (LAYOUT.DebugHeaderHeight / window.innerHeight) * 100;

    this.state = {
      ...defaultState,
      splitSizes: [100 - debugPanePercentage, debugPanePercentage],
      lastNonZeroSize: props.debugPane ? debugPanePercentage : 30,
    };
    this.handleChange = this.handleChange.bind(this);
    this.getContextViewer = this.getContextViewer.bind(this);
  }

  public componentDidMount() {
    if (this.props.logs) {
      this.props.showLogs(true);
    }
  }

  public onClickHandler(header: string) {
    const mainEditor = this.props.editorRef;
    const compiledEditor = this.props.compiledEditorRef;

    const editor = this.props.editorFocus === EDITOR_FOCUS.SpecEditor ? mainEditor : compiledEditor;

    const model = editor.getModel();

    const rangeValue = model.findMatches(header, true, true, true, WORD_SEPARATORS, true);

    editor && editor.deltaDecorations(this.props.decorations, []);

    const decorations = editor.deltaDecorations(
      [],
      rangeValue.map((match) => ({
        options: {inlineClassName: 'myInlineDecoration'},
        range: match.range,
      })),
    );

    this.props.setDecorations(decorations);

    if (rangeValue[0]) {
      editor.revealRangeInCenter(rangeValue[0].range);
      editor.focus();
      editor.layout();
      Promise.resolve().then(() => {
        (document.activeElement as HTMLElement).blur();
      });
    }
  }

  public handleChange(sizes: number[]) {
    const size = sizes[1] * window.innerHeight;
    const headerHeightPercent = (LAYOUT.DebugHeaderHeight / window.innerHeight) * 100;

    this.setState({
      splitSizes: sizes,
      lastNonZeroSize: sizes[1] > headerHeightPercent ? sizes[1] : this.state.lastNonZeroSize,
    });

    this.props.setDebugPaneSize(size);

    if (size > LAYOUT.MinPaneSize + 20 && !this.props.debugPane) {
      this.props.toggleDebugPane();
    } else if (size <= LAYOUT.MinPaneSize + 20 && this.props.debugPane) {
      this.props.toggleDebugPane();
    }
  }

  public componentDidUpdate(prevProps) {
    if (this.props.debugPane !== prevProps.debugPane) {
      if (this.props.debugPane) {
        const expandedSize = Math.max(this.state.lastNonZeroSize, 20);
        this.setState({
          splitSizes: [100 - expandedSize, expandedSize],
        });

        const sizeInPixels = (expandedSize / 100) * window.innerHeight;
        this.props.setDebugPaneSize(sizeInPixels);
      } else {
        const headerHeightPercent = (LAYOUT.DebugHeaderHeight / window.innerHeight) * 100;
        this.setState({splitSizes: [100 - headerHeightPercent, headerHeightPercent]});
      }
    }

    if (this.props.error || this.props.errors.length) {
      this.props.showLogs(true);
    }
  }

  /**
   *  Get the Component to be rendered in the Context Viewer.
   */
  public getContextViewer() {
    if (!this.props.debugPane) {
      return null;
    }
    if (this.props.view) {
      switch (this.props.navItem) {
        case NAVBAR.DataViewer:
          return <DataViewer onClickHandler={(header) => this.onClickHandler(header)} />;
        case NAVBAR.SignalViewer:
          return <SignalViewer onClickHandler={(header) => this.onClickHandler(header)} />;
        case NAVBAR.DataflowViewer:
          return <DataflowViewer />;
        default:
          return null;
      }
    } else {
      return null;
    }
  }

  public render() {
    const container = (
      <div className="chart-container">
        <ErrorBoundary>
          <Renderer />
        </ErrorBoundary>
        <div className="versions">
          Vega {VG_VERSION}, Vega-Lite {VL_VERSION}, Vega-Tooltip {TOOLTIP_VERSION}, Editor {COMMIT_HASH.slice(0, 7)}
        </div>
      </div>
    );

    return (
      <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
        <Split
          sizes={this.state.splitSizes}
          minSize={(LAYOUT.DebugHeaderHeight / window.innerHeight) * 100}
          expandToMin={false}
          gutterSize={10}
          gutterAlign="center"
          snapOffset={30}
          dragInterval={1}
          direction="vertical"
          cursor="row-resize"
          onDrag={this.handleChange}
          onDragStart={() => {
            if (this.props.navItem === NAVBAR.Logs) {
              this.props.showLogs(true);
            }
          }}
          onDragEnd={() => {
            if (this.props.debugPane && this.props.debugPaneSize <= LAYOUT.MinPaneSize) {
              this.props.setDebugPaneSize(LAYOUT.DebugPaneSize);
            }
          }}
        >
          {container}

          <div className="debug-pane">
            <DebugPaneHeader />
            <div className="debug-pane-content" style={{display: this.props.debugPane ? 'flex' : 'none'}}>
              {this.props.error || (this.props.logs && this.props.navItem === NAVBAR.Logs) ? (
                <ErrorPane />
              ) : (
                this.getContextViewer()
              )}
            </div>
          </div>
        </Split>
      </div>
    );
  }
}
