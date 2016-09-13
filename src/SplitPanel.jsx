import React from "react";
import classNames from "classnames";
import _ from "lodash";

/**
 * A container that lays out its children (henceforth referred to as
 * "subpanels") in resizeable rows or columns.
 *
 * Each subpanel is sized according to its weight, which is a fraction of the
 * sum over all weights. E.g., if you specify weights=[30,60,10] the subpanels
 * will receive 30%, 60% and 10% of the available space respectively. If you
 * then remove the first subpanel and weights=[60,10] the remaining subpanels
 * will receive approximately 86% and 14% of the available space.
 *
 * N.B. If you specify too few or too many weights a console warning will be
 * issued. If you specified too few the minimum weight specified is
 * used for all remaining elements. Any additional weights will be ignored.
 */
export default class SplitPanel extends React.Component {
  static propTypes = {
    /**
     * The direction to layout subpanels. One of "horizontal" or "vertical".
     *
     * Default: horizontal
     */
    direction: React.PropTypes.oneOf(["horizontal", "vertical"]),

    /**
     * The minimum size (in pixels) of a subpanel. The divider will stop
     * abruptly if the user attempts to shrink a subpanel below this size.
     *
     * Default: 25
     */
    minPanelSize: React.PropTypes.number,

    /**
     * Called whenever a subpanel is resized.
     *
     * You should update `weights` in response to this event unless you're
     * using `defaultWeights`.
     */
    onWeightChange: React.PropTypes.func,

    /**
     * The weights of each subpanel. If you're using this property you must
     * manually update this prop in response to `onWeightChange` otherwise
     * the subpanels will not resize.
     */
    weights: React.PropTypes.arrayOf(React.PropTypes.number),

    /**
     * The default weights to use when you are not managing the weights
     * manually via the `weights` and `onWeightChange` props.
     */
    defaultWeights: React.PropTypes.arrayOf(React.PropTypes.number),

    /**
     * The resize step size in pixels.
     *
     * Useful if you have monospaced text and you want to ensure the panel
     * is resized in increments of one character width.
     *
     * Default: 1
     */
    stepSize: React.PropTypes.number,
  };

  static defaultProps = {
    direction: "horizontal",
    minPanelSize: 25,
    stepSize: 1,
  };

  constructor() {
    super();

    this.state = {
      // The last position of the cursor. Used by onMouseMove to calculate
      // relative changes in divider position.
      lastCursorPosition: 0,
      // Sizes of the subpanels taking into account the weights and divider
      // size.
      sizes: [],
      // Offsets of each subpanel.
      offsets: [],
      // The index of the divider currently being dragged by the user.
      activeDividerIndex: -1,
    };

    // Bind event listeners in advance.
    this.onDividerMouseDown = this.onDividerMouseDown.bind(this);
    // These two are attached to `window` because sometimes due to glitches we
    // can't do very much about we'll be unable to move the divider in time to
    // keep up with the mouse cursor, but we still need to move the divider to
    // catch up and to release it when the user releases the divider.
    // N.B. These are attached in componentDidMount and detached in
    // componentWillUnmount.
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  render() {
    // Create a sized splitPanelItem with a divider for each child, except...
    const childrenWithDividers = [];
    const children = React.Children.toArray(this.props.children);
    for (let i = 0; i < children.length; i++) {
      const style = {
        [this.cssSizeProperty]: this.sizes[i],
        [this.cssOffsetProperty]: this.offsets[i],
      };

      childrenWithDividers.push(<div key={`panel-${i}`}
        className="split-panel-item"
        style={style}>{children[i]}</div>);

      // ...don't add a divider if it's the last panel.
      if (i < children.length - 1) {
        const dividerStyle = {
          [this.cssOffsetProperty]: this.offsets[i + 1] - this.dividerSize,
        };
        childrenWithDividers.push(<div
          key={`divider-${i}`} ref={`divider-${i}`}
          className="split-panel-divider"
          style={dividerStyle}
          onMouseDown={e => this.onDividerMouseDown(e, i)}>
        </div>);
      }
    }

    // Because elements don't have a resize event we create an <object> with
    // no content and filling the entire panel. When this object's
    // contentDocument.resize event fires we know to update the sizes of all
    // the subpanels. :-)
    const resizeHackObject = <object className="split-panel-resize-hack-object"
      ref="resizeHackObject"
      type="text/html">
    </object>;
    const klass = classNames("split-panel", this.props.direction, {
      "split-panel-resizing": this.state.activeDividerIndex != -1,
    });
    return <div ref="self" className={klass}>
      {resizeHackObject}
      {childrenWithDividers}
    </div>;
  }

  //////
  // Component Lifecycle
  //////
  componentWillReceiveProps(newProps) {
    const newChildren = newProps.children || this.props.children;
    if (newProps.weights) {
      this.updateSizes(newProps.weights, newChildren);
    }
  }

  componentDidMount() {
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    // We do this here because we can't guarantee that the event handler will be
    // added before data is assigned if we do it in the JSX.
    this.refs.resizeHackObject.addEventListener("load", () => this.onResizeHackObjectLoad());
    this.refs.resizeHackObject.data = "about:blank";
    this.updateSizes();
  }

  componentWillUnmount() {
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
  }

  //////
  // Properties
  //////
  /**
   * Gets the weights for each panel. This prefers this.props.weights, falling
   * through to this.state.weights then this.props.defaultWeights.
   *
   * An Error is thrown if no weights are specified.
   */
  get weights() {
    let weights = null;
    if (this.props.weights && this.props.weights.length) {
      weights = this.props.weights;
    }
    else if (this.state.weights && this.state.weights.length) {
      weights = this.state.weights;
    }
    else if (this.props.defaultWeights && this.props.defaultWeights.length) {
      weights = this.props.defaultWeights;
    }
    else {
      throw new Error("SplitPanel: You must set a 'weights' or 'defaultWeights' prop");
    }
    return this.padOrTruncateWeights(weights);
  }

  get cursorPositionProperty() {
    return this.props.direction == "horizontal" ? "clientX" : "clientY";
  }

  get cssSizeProperty() {
    return this.props.direction == "horizontal" ? "width" : "height";
  }

  get cssOffsetProperty() {
    return this.props.direction == "horizontal" ? "left" : "top";
  }

  get domSizeProperty() {
    return this.props.direction == "horizontal" ?
      "clientWidth" : "clientHeight";
  }

  get dividerSize() {
    // During the initial render we can't calculate this, so default to 5px.
    // A fresh render is forced after the component is mounted to it doesn't
    // matter.
    if (this.refs["divider-0"]) {
      return this.refs["divider-0"][this.domSizeProperty];
    }
    else {
      return 5;
    }
  }

  get sizes() {
    const numChildren = React.Children.count(this.props.children);
    if (this.state.sizes.length == numChildren) {
      return this.state.sizes;
    }
    else {
      // XXX: We can't calculate the sizes until the component has been rendered
      // at least once (so we can't just call this.updateSizes() here) because
      // we need to obtain the divider size from the DOM.
      // Instead we say that all the panels are at the minimum size and hope
      // the initial render occurs quickly. XXX: Extra XXX to emphasise how ugly
      // this is.
      return _.fill(new Array(numChildren), this.props.minPanelSize);
    }
  }

  get offsets() {
    const numChildren = React.Children.count(this.props.children);
    if (this.state.offsets.length == numChildren) {
      return this.state.offsets;
    }
    else {
      // See the comment in `get sizes()`. The same applies here.
      return _.fill(new Array(numChildren), 0);
    }
  }

  //////
  // Event Handlers
  //////
  onResizeHackObjectLoad() {
    this.refs.resizeHackObject.contentDocument.defaultView.addEventListener(
      "resize", () => this.updateSizes());
  }

  onDividerMouseDown(e, dividerIndex) {
    this.setState({
      activeDividerIndex: dividerIndex,
      lastCursorPosition: e[this.cursorPositionProperty],
    });
  }

  onMouseUp() {
    this.setState({ activeDividerIndex: -1 });
  }

  onMouseMove(e) {
    if (this.state.activeDividerIndex == -1) return;
    // If moving backwards (left or up) grow the next panel by taking space
    // from the previous one. If moving forwards (right or down) grow the
    // previous panel by taking space from the next.
    //
    // Horizontal: <previous>|<next>
    // Vertical:
    //  <previous>
    //  ----------
    //  <next>
    const prevIndex = this.state.activeDividerIndex;
    const nextIndex = prevIndex + 1;
    // First obtain the size difference, rounding it down to a multiple of
    // the step size...
    let diff = e[this.cursorPositionProperty] - this.state.lastCursorPosition;
    const steppedDiff = ((diff / this.props.stepSize) | 0) * this.props.stepSize;
    if (steppedDiff == 0) {
      // No change.
      return;
    }
    // ...then make it proportional to the total weight rather than the
    // container size.
    const weights = this.weights;
    const weightDiff = steppedDiff / this.refs.self[this.domSizeProperty] *
      _.sum(weights);

    // If weightDiff is negative we're moving backwards, so this will shrink
    // <previous> and grow <next>. Otherwise, we're moving forwards and
    // <previous> will grow while <next> shrinks.
    weights[prevIndex] += weightDiff;
    weights[nextIndex] -= weightDiff;
    this.emitWeightChange(weights);
    this.setState({
      // We subtract the portion of the difference that we discarded to avoid
      // accumulating rounding errors resulting in the cursor and divider
      // positions drifting apart.
      lastCursorPosition: e[this.cursorPositionProperty] - (diff - steppedDiff),
    });
  }

  //////
  // Event Emitters
  //////
  emitWeightChange(newWeights) {
    // Only set weights on the state if we don't expect the parent to
    // accept/reject the new weights by updating this.props.weights.
    if (this.props.defaultWeights && this.props.defaultWeights.length) {
      this.setState({ weights: newWeights }, () => this.updateSizes());
    }
    // Notify the parent that we'd like to change the weights.
    if (this.props.onWeightChange) {
      this.props.onWeightChange(newWeights);
    }
  }

  //////
  // Utilities
  //////
  /**
   * Recalculates the size of each panel according to the weights, taking into
   * account the space used by the dividers then updates this.state.sizes
   * and this.state.offsets.
   */
  updateSizes(weights, children) {
    weights = weights || this.weights;
    weights = this.padOrTruncateWeights(weights, children);
    const totalWeight = _.sum(weights);
    // Total space taken by the dividers spread equally across all panels.
    const dividerCompensation =
      this.dividerSize * (weights.length - 1) / weights.length;
    const offsets = [];
    const sizes = [];
    for (let i = 0; i < weights.length; i++) {
      offsets.push(_.sum(sizes) + 2 * dividerCompensation * i);
      const proportion = weights[i] / totalWeight;
      sizes.push(Math.max(
        proportion * this.refs.self[this.domSizeProperty] - dividerCompensation,
        this.props.minPanelSize
      ));
    }
    this.setState({ sizes: sizes, offsets: offsets });
  }

  padOrTruncateWeights(weights, children = this.props.children) {
    const numChildren = React.Children.count(children);
    if (weights.length < numChildren) {
      const min = _.min(weights);
      while (weights.length < numChildren) {
        weights.push(min);
      }
      console.warn(`SplitPanel: Only ${weights.length} weights specified ` +
        `but there are ${numChildren} subpanels; using ${min} for the ` +
        `remaining subpanels`);
    }
    else if (weights.length > numChildren) {
      weights = weights.splice(0, numChildren);
      console.warn(`SplitPanel: ${weights.length} weights specified but ` +
        `there are only ${numChildren} subpanels; ignoring additional weights`);
    }
    return weights;
  }
}

