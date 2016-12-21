"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _classnames = require("classnames");

var _classnames2 = _interopRequireDefault(_classnames);

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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
var SplitPanel = function (_React$Component) {
  _inherits(SplitPanel, _React$Component);

  function SplitPanel() {
    _classCallCheck(this, SplitPanel);

    var _this = _possibleConstructorReturn(this, (SplitPanel.__proto__ || Object.getPrototypeOf(SplitPanel)).call(this));

    _this.state = {
      // The last position of the cursor. Used by onMouseMove to calculate
      // relative changes in divider position.
      lastCursorPosition: 0,
      // Sizes of the subpanels taking into account the weights and divider
      // size.
      sizes: [],
      // Offsets of each subpanel.
      offsets: [],
      // The index of the divider currently being dragged by the user.
      activeDividerIndex: -1
    };

    // Bind event listeners in advance.
    _this.onDividerMouseDown = _this.onDividerMouseDown.bind(_this);
    // These two are attached to `window` because sometimes due to glitches we
    // can't do very much about we'll be unable to move the divider in time to
    // keep up with the mouse cursor, but we still need to move the divider to
    // catch up and to release it when the user releases the divider.
    // N.B. These are attached in componentDidMount and detached in
    // componentWillUnmount.
    _this.onMouseMove = _this.onMouseMove.bind(_this);
    _this.onMouseUp = _this.onMouseUp.bind(_this);
    _this.doAdjustmentOnMouseUp = true;
    _this.exitMouseMoveOnViolation = true;
    _this.adjustOnReceiveProps = true;
    _this.doAdjustmentOnMouseMove = false;
    return _this;
  }

  _createClass(SplitPanel, [{
    key: "render",
    value: function render() {
      var _this2 = this;

      // Create a sized splitPanelItem with a divider for each child, except...
      var childrenWithDividers = [];
      var children = _react2.default.Children.toArray(this.props.children);

      var _loop = function _loop(i) {
        var _style;

        var style = (_style = {}, _defineProperty(_style, _this2.cssSizeProperty, _this2.sizes[i]), _defineProperty(_style, _this2.cssOffsetProperty, _this2.offsets[i]), _style);

        childrenWithDividers.push(_react2.default.createElement(
          "div",
          { key: "panel-" + i,
            className: "split-panel-item",
            style: style },
          children[i]
        ));

        // ...don't add a divider if it's the last panel.
        if (i < children.length - 1) {
          var dividerStyle = _defineProperty({}, _this2.cssOffsetProperty, _this2.offsets[i + 1] - _this2.dividerSize);
          childrenWithDividers.push(_react2.default.createElement("div", {
            key: "divider-" + i, ref: "divider-" + i,
            className: "split-panel-divider",
            style: dividerStyle,
            onMouseDown: function onMouseDown(e) {
              return _this2.onDividerMouseDown(e, i);
            } }));
        }
      };

      for (var i = 0; i < children.length; i++) {
        _loop(i);
      }

      // Because elements don't have a resize event we create an <object> with
      // no content and filling the entire panel. When this object's
      // contentDocument.resize event fires we know to update the sizes of all
      // the subpanels. :-)
      var resizeHackObject = _react2.default.createElement("object", { className: "split-panel-resize-hack-object",
        ref: "resizeHackObject",
        type: "text/html" });
      var klass = (0, _classnames2.default)("split-panel", this.props.direction, {
        "split-panel-resizing": this.state.activeDividerIndex != -1
      });
      return _react2.default.createElement(
        "div",
        { ref: "self", className: klass },
        resizeHackObject,
        childrenWithDividers
      );
    }

    //////
    // Component Lifecycle
    //////

  }, {
    key: "componentWillReceiveProps",
    value: function componentWillReceiveProps(newProps) {
      if (newProps.weights) {
        var weights = this.adjustOnReceiveProps ? this.adjust(newProps.weights) : newProps.weights;
        // console.log("componentWillReceiveProps updating with weights: ", weights);
        this.updateSizes(weights);
      }
    }
  }, {
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this3 = this;

      window.addEventListener("mouseup", this.onMouseUp);
      window.addEventListener("mousemove", this.onMouseMove);
      // We do this here because we can't guarantee that the event handler will be
      // added before data is assigned if we do it in the JSX.
      this.refs.resizeHackObject.addEventListener("load", function () {
        return _this3.onResizeHackObjectLoad();
      });
      this.refs.resizeHackObject.data = "about:blank";
      this.updateSizes();
    }
  }, {
    key: "componentWillUnmount",
    value: function componentWillUnmount() {
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

  }, {
    key: "onResizeHackObjectLoad",


    //////
    // Event Handlers
    //////
    value: function onResizeHackObjectLoad() {
      var _this4 = this;

      this.refs.resizeHackObject.contentDocument.defaultView.addEventListener("resize", function () {
        return _this4.updateSizes();
      });
    }
  }, {
    key: "onDividerMouseDown",
    value: function onDividerMouseDown(e, dividerIndex) {
      var newState = {
        activeDividerIndex: dividerIndex,
        lastCursorPosition: e[this.cursorPositionProperty]
      };
      this.setState(newState);
    }
  }, {
    key: "onMouseUp",
    value: function onMouseUp() {
      //Adjust any messed up state at this point
      //So they can drag around as much as they want, and state will get out of whack
      //But as soon as they let go it'll fix itself
      var mouseIsDown = this.state.activeDividerIndex !== -1;
      var weights = this.weights;
      if (mouseIsDown && this.doAdjustmentOnMouseUp && weights) {
        var adjustedWeights = this.adjust(weights);
        this.emitWeightChange(adjustedWeights);
      }

      this.setState({ activeDividerIndex: -1 });
    }
  }, {
    key: "onMouseMove",
    value: function onMouseMove(e) {
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
      var prevIndex = this.state.activeDividerIndex;
      var nextIndex = prevIndex + 1;
      // First obtain the size difference, rounding it down to a multiple of
      // the step size...
      var diff = e[this.cursorPositionProperty] - this.state.lastCursorPosition;
      var steppedDiff = (diff / this.props.stepSize | 0) * this.props.stepSize;
      if (steppedDiff == 0) {
        // No change.
        return;
      }
      // ...then make it proportional to the total weight rather than the
      // container size.
      var weights = this.weights;
      var weightDiff = steppedDiff / this.refs.self[this.domSizeProperty] * _lodash2.default.sum(weights);

      // handle the case where minPanelSize is respected for the small panel, but its neighbor grows (it shouldn't)
      var weightPrev = weights[prevIndex];
      var weightNext = weights[nextIndex];
      var minWeight = this.pxToWeight(weights, this.props.minPanelSize);

      function weightViolated(weight, minWeight, directionIsWrong) {
        return weight <= minWeight && directionIsWrong;
      }

      //the previous weight is violated when it's too small, and we're moving in the negative direction, so it's getting smaller
      var prevWeightViolated = weightViolated(weightPrev, minWeight, weightDiff < 0);

      //the next weight is violated when it's too small, and we're moving in the positive direction, so it's getting smaller
      var nextWeightViolated = weightViolated(weightNext, minWeight, weightDiff > 0);

      // console.log("prevWeightViolated", prevWeightViolated);
      // console.log("nextWeightViolated", nextWeightViolated);

      if (this.exitMouseMoveOnViolation && (prevWeightViolated || nextWeightViolated)) {
        return;
      }

      // If weightDiff is negative we're moving backwards, so this will shrink
      // <previous> and grow <next>. Otherwise, we're moving forwards and
      // <previous> will grow while <next> shrinks.
      weights[prevIndex] += weightDiff;
      weights[nextIndex] -= weightDiff;

      if (this.doAdjustmentOnMouseMove) {
        var adjustedWeights = this.adjust(weights);
        this.emitWeightChange(adjustedWeights);
      } else {
        this.emitWeightChange(weights);
      }
      var newState = {
        // We subtract the portion of the difference that we discarded to avoid
        // accumulating rounding errors resulting in the cursor and divider
        // positions drifting apart.
        lastCursorPosition: e[this.cursorPositionProperty] - (diff - steppedDiff)
      };
      this.setState(newState);
    }

    //////
    // Event Emitters
    //////

  }, {
    key: "emitWeightChange",
    value: function emitWeightChange(newWeights) {
      var _this5 = this;

      // Only set weights on the state if we don't expect the parent to
      // accept/reject the new weights by updating this.props.weights.
      if (this.props.defaultWeights && this.props.defaultWeights.length) {
        this.setState({ weights: newWeights }, function () {
          return _this5.updateSizes();
        });
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
     * Caution, mutating params
     *
     * @param sizes
     * @param adjustmentNeeded
     */

  }, {
    key: "adjustMaxDown",
    value: function adjustMaxDown(sizes, adjustmentNeeded) {
      var maxIndex = 0;
      var maxPanelSize = sizes[0];
      for (var i = 0; i < sizes.length; i++) {
        if (sizes[i] > maxPanelSize) {
          maxPanelSize = sizes[i];
          maxIndex = i;
        }
      }
      sizes[maxIndex] -= adjustmentNeeded;
    }
  }, {
    key: "adjustMinUp",
    value: function adjustMinUp(sizes, adjustmentNeeded) {
      var minIndex = 0;
      var minPanelSize = sizes[0];
      for (var i = 0; i < sizes.length; i++) {
        if (sizes[i] < minPanelSize) {
          minPanelSize = sizes[i];
          minIndex = i;
        }
      }
      sizes[minIndex] += adjustmentNeeded;
    }
  }, {
    key: "adjust",
    value: function adjust(weights) {
      //correct for sizes that got too big or too small
      var sizesAndOffsets = this.calcSizesAndOffsets(weights);
      var sizes = sizesAndOffsets.sizes;
      var offsets = sizesAndOffsets.offsets;
      var sumOfSizes = _lodash2.default.sum(sizes);
      var domContainerSize = this.refs.self[this.domSizeProperty];
      var expectedSumOfSizes = domContainerSize - this.dividerSize * (weights.length - 1);
      var diff = sumOfSizes - expectedSumOfSizes;

      if (diff > 0) {
        // console.log("Adjusting: sumOfSizes is " + diff + " higher than expectedSumOfSizes");
        this.adjustMaxDown(sizes, diff);
        return _lodash2.default.map(sizes, function (size) {
          return size / expectedSumOfSizes * 100;
        });
      } else if (diff < 0) {
        var absDiff = -diff;
        // console.log("Adjusting: sumOfSizes is " + absDiff + " lower than expectedSumOfSizes");
        this.adjustMinUp(sizes, absDiff);
        return _lodash2.default.map(sizes, function (size) {
          return size / expectedSumOfSizes * 100;
        });
      }

      return weights;
    }
  }, {
    key: "weightToPx",
    value: function weightToPx(weights, index) {
      var totalWeight = _lodash2.default.sum(weights);
      // Total space taken by the dividers spread equally across all panels.
      var dividerCompensation = this.dividerSize * (weights.length - 1) / weights.length;
      var proportion = weights[index] / totalWeight;
      return proportion * this.refs.self[this.domSizeProperty] - dividerCompensation;
    }
  }, {
    key: "pxToWeight",
    value: function pxToWeight(weights, pixels) {
      // Total space taken by the dividers spread equally across all panels.
      var dividerCompensation = this.dividerSize * (weights.length - 1) / weights.length;
      return 100 * ((pixels + dividerCompensation) / this.refs.self[this.domSizeProperty]);
    }
  }, {
    key: "calcSizesAndOffsets",
    value: function calcSizesAndOffsets(weights, children) {
      // console.log("calcSizesAndOffsets");
      // console.log("weights", weights);
      // console.log("children", children);
      weights = weights || this.weights;
      weights = this.padOrTruncateWeights(weights, children);
      var totalWeight = _lodash2.default.sum(weights);
      // Total space taken by the dividers spread equally across all panels.
      var dividerCompensation = this.dividerSize * (weights.length - 1) / weights.length;
      var offsets = [];
      var sizes = [];
      for (var i = 0; i < weights.length; i++) {
        //TODO fix the math here, offsets start to be further and further off as the number of panes grows
        offsets.push(_lodash2.default.sum(sizes) + 2 * dividerCompensation * i);
        var sizeInPx = this.weightToPx(weights, i);
        sizes.push(Math.max(sizeInPx, this.props.minPanelSize));
      }
      return { sizes: sizes, offsets: offsets };
    }

    /**
     * Recalculates the size of each panel according to the weights, taking into
     * account the space used by the dividers then updates this.state.sizes
     * and this.state.offsets.
     */

  }, {
    key: "updateSizes",
    value: function updateSizes(weights, children) {
      // console.log("updateSizes");
      // console.log("weights", weights);
      // console.log("children", children);
      var sizesAndOffsets = this.calcSizesAndOffsets(weights, children);
      this.setState(sizesAndOffsets);
    }

    /**
     * Caution, mutating params
     *
     * @param weights
     * @returns {*}
     */

  }, {
    key: "padOrTruncateWeights",
    value: function padOrTruncateWeights(weights) {
      var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.props.children;

      return weights;
      // console.log("padOrTruncateWeights");
      // console.log("weights", weights);
      // console.log("children", children);
      // const numChildren = React.Children.count(children);
      // if (weights.length < numChildren) {
      //   const min = Math.max(_.min(weights), this.props.minPanelSize);
      //   console.warn(`SplitPanel: Only ${weights.length} weights specified ` +
      //     `but there are ${numChildren} subpanels; using ${min} for the ` +
      //     `remaining subpanels`);
      //   while (weights.length < numChildren) {
      //     weights.push(min);
      //   }
      // }
      // else if (weights.length > numChildren) {
      //   console.warn(`SplitPanel: ${weights.length} weights specified but ` +
      //     `there are only ${numChildren} subpanels; ignoring additional weights`);
      //   weights = weights.splice(0, numChildren);
      // }
      // return weights;
    }
  }, {
    key: "weights",
    get: function get() {
      var weights = null;
      if (this.props.weights && this.props.weights.length) {
        weights = this.props.weights;
      } else if (this.state.weights && this.state.weights.length) {
        weights = this.state.weights;
      } else if (this.props.defaultWeights && this.props.defaultWeights.length) {
        weights = this.props.defaultWeights;
      } else {
        throw new Error("SplitPanel: You must set a 'weights' or 'defaultWeights' prop");
      }
      return this.padOrTruncateWeights(weights);
    }
  }, {
    key: "cursorPositionProperty",
    get: function get() {
      return this.props.direction == "horizontal" ? "clientX" : "clientY";
    }
  }, {
    key: "cssSizeProperty",
    get: function get() {
      return this.props.direction == "horizontal" ? "width" : "height";
    }
  }, {
    key: "cssOffsetProperty",
    get: function get() {
      return this.props.direction == "horizontal" ? "left" : "top";
    }
  }, {
    key: "domSizeProperty",
    get: function get() {
      return this.props.direction == "horizontal" ? "clientWidth" : "clientHeight";
    }
  }, {
    key: "dividerSize",
    get: function get() {
      // During the initial render we can't calculate this, so default to 5px.
      // A fresh render is forced after the component is mounted to it doesn't
      // matter.
      if (this.refs["divider-0"]) {
        return this.refs["divider-0"][this.domSizeProperty];
      } else {
        return 5;
      }
    }
  }, {
    key: "sizes",
    get: function get() {
      var numChildren = _react2.default.Children.count(this.props.children);
      if (this.state.sizes.length == numChildren) {
        return this.state.sizes;
      } else {
        // XXX: We can't calculate the sizes until the component has been rendered
        // at least once (so we can't just call this.updateSizes() here) because
        // we need to obtain the divider size from the DOM.
        // Instead we say that all the panels are at the minimum size and hope
        // the initial render occurs quickly. XXX: Extra XXX to emphasise how ugly
        // this is.
        return _lodash2.default.fill(new Array(numChildren), this.props.minPanelSize);
      }
    }
  }, {
    key: "offsets",
    get: function get() {
      var numChildren = _react2.default.Children.count(this.props.children);
      if (this.state.offsets.length == numChildren) {
        return this.state.offsets;
      } else {
        // See the comment in `get sizes()`. The same applies here.
        return _lodash2.default.fill(new Array(numChildren), 0);
      }
    }
  }]);

  return SplitPanel;
}(_react2.default.Component);

SplitPanel.propTypes = {
  /**
   * The direction to layout subpanels. One of "horizontal" or "vertical".
   *
   * Default: horizontal
   */
  direction: _react2.default.PropTypes.oneOf(["horizontal", "vertical"]),

  /**
   * The minimum size (in pixels) of a subpanel. The divider will stop
   * abruptly if the user attempts to shrink a subpanel below this size.
   *
   * Default: 25
   */
  minPanelSize: _react2.default.PropTypes.number,

  /**
   * Called whenever a subpanel is resized.
   *
   * You should update `weights` in response to this event unless you're
   * using `defaultWeights`.
   */
  onWeightChange: _react2.default.PropTypes.func,

  /**
   * The weights of each subpanel. If you're using this property you must
   * manually update this prop in response to `onWeightChange` otherwise
   * the subpanels will not resize.
   */
  weights: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.number),

  /**
   * The default weights to use when you are not managing the weights
   * manually via the `weights` and `onWeightChange` props.
   */
  defaultWeights: _react2.default.PropTypes.arrayOf(_react2.default.PropTypes.number),

  /**
   * The resize step size in pixels.
   *
   * Useful if you have monospaced text and you want to ensure the panel
   * is resized in increments of one character width.
   *
   * Default: 1
   */
  stepSize: _react2.default.PropTypes.number
};
SplitPanel.defaultProps = {
  direction: "horizontal",
  minPanelSize: 25,
  stepSize: 1
};
exports.default = SplitPanel;