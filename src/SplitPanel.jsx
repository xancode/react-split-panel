import React from 'react';
import classNames from 'classnames';

export default class SplitPanel extends React.Component {
  static propTypes = {
    direction: React.PropTypes.oneOf(['horizontal', 'vertical']),
    minPanelSize: React.PropTypes.number
  };

  static defaultProps = {
    direction: 'horizontal',
    minPanelSize: 25
  };

  constructor() {
    super();

    this.state = {
      cursorLast: 0,
      firstSize: 0,
      lastSize: 0
    };

    // Bind event listeners in advance.
    this.onDividerMouseDown = this.onDividerMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  get cursorPositionProperty() {
    return this.props.direction == 'horizontal' ? 'clientX' : 'clientY';
  }

  get cssSizeProperty() {
    return this.props.direction == 'horizontal' ? 'width' : 'height';
  }

  get domSizeProperty() {
    return this.props.direction == 'horizontal' ?
      'clientWidth' : 'clientHeight';
  }

  get dividerSize() {
    return this.refs.divider[this.domSizeProperty];
  }

  onDividerMouseDown(e) {
    this.setState({
      dragging: true,
      cursorLast: e[this.cursorPositionProperty]
    });
  }

  onMouseUp() {
    this.setState({ dragging: false });
  }

  onMouseMove(e) {
    if (!this.state.dragging) return;

    let dividerPosition = this.state.dividerPos +
      e[this.cursorPositionProperty] - this.state.cursorLast;
    dividerPosition = Math.min(
      this.refs.self[this.domSizeProperty] - this.props.minPanelSize,
      dividerPosition);
    dividerPosition = Math.max(this.props.minPanelSize, dividerPosition);

    this.setState({
      dividerPos: dividerPosition,
      firstSize: dividerPosition - this.dividerSize / 2,
      lastSize: this.refs.self[this.domSizeProperty] -
        dividerPosition - this.dividerSize / 2,
      cursorLast: e[this.cursorPositionProperty]
    });
  }

  componentDidMount() {
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);

    const totalSize = this.refs.self[this.domSizeProperty];
    this.setState({
      dividerPos: totalSize / 2,
      firstSize: totalSize / 2 - this.dividerSize / 2,
      lastSize: totalSize / 2 - this.dividerSize / 2
    });
  }

  componentWillUnmount() {
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
  }

  render() {
    const firstStyle = { [this.cssSizeProperty]: this.state.firstSize };
    const lastStyle = { [this.cssSizeProperty]: this.state.lastSize };

    const klass = classNames("splitPanel", this.props.direction, {
      'splitPanelResizing': this.state.dragging
    });
    return <div ref="self" className={klass}>
      <div className="splitPanelItem" style={firstStyle}>
        {this.props.children[0]}
      </div>

      <div ref="divider" className="splitPanelDivider"
        onMouseDown={this.onDividerMouseDown}></div>

      <div className="splitPanelItem" style={lastStyle}>
        {this.props.children[1]}
      </div>
    </div>;
  }
}

