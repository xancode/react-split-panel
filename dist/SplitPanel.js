'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SplitPanel = (function (_React$Component) {
  _inherits(SplitPanel, _React$Component);

  function SplitPanel() {
    _classCallCheck(this, SplitPanel);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(SplitPanel).call(this));

    _this.state = {
      cursorLast: 0,
      firstSize: 0,
      lastSize: 0
    };

    // Bind event listeners in advance.
    _this.onDividerMouseDown = _this.onDividerMouseDown.bind(_this);
    _this.onMouseMove = _this.onMouseMove.bind(_this);
    _this.onMouseUp = _this.onMouseUp.bind(_this);
    return _this;
  }

  _createClass(SplitPanel, [{
    key: 'onDividerMouseDown',
    value: function onDividerMouseDown(e) {
      this.setState({
        dragging: true,
        cursorLast: e[this.cursorPositionProperty]
      });
    }
  }, {
    key: 'onMouseUp',
    value: function onMouseUp() {
      this.setState({ dragging: false });
    }
  }, {
    key: 'onMouseMove',
    value: function onMouseMove(e) {
      if (!this.state.dragging) return;

      var dividerPosition = this.state.dividerPos + e[this.cursorPositionProperty] - this.state.cursorLast;
      dividerPosition = Math.min(this.refs.self[this.domSizeProperty] - this.props.minPanelSize, dividerPosition);
      dividerPosition = Math.max(this.props.minPanelSize, dividerPosition);

      this.setState({
        dividerPos: dividerPosition,
        firstSize: dividerPosition - this.dividerSize / 2,
        lastSize: this.refs.self[this.domSizeProperty] - dividerPosition - this.dividerSize / 2,
        cursorLast: e[this.cursorPositionProperty]
      });
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      window.addEventListener('mouseup', this.onMouseUp);
      window.addEventListener('mousemove', this.onMouseMove);

      var totalSize = this.refs.self[this.domSizeProperty];
      this.setState({
        dividerPos: totalSize / 2,
        firstSize: totalSize / 2 - this.dividerSize / 2,
        lastSize: totalSize / 2 - this.dividerSize / 2
      });
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      window.removeEventListener('mouseup', this.onMouseUp);
      window.removeEventListener('mousemove', this.onMouseMove);
    }
  }, {
    key: 'render',
    value: function render() {
      var firstStyle = _defineProperty({}, this.cssSizeProperty, this.state.firstSize);
      var lastStyle = _defineProperty({}, this.cssSizeProperty, this.state.lastSize);

      var klass = (0, _classnames2.default)("splitPanel", this.props.direction, {
        'splitPanelResizing': this.state.dragging
      });
      return _react2.default.createElement(
        'div',
        { ref: 'self', className: klass },
        _react2.default.createElement(
          'div',
          { className: 'splitPanelItem', style: firstStyle },
          this.props.children[0]
        ),
        _react2.default.createElement('div', { ref: 'divider', className: 'splitPanelDivider',
          onMouseDown: this.onDividerMouseDown }),
        _react2.default.createElement(
          'div',
          { className: 'splitPanelItem', style: lastStyle },
          this.props.children[1]
        )
      );
    }
  }, {
    key: 'cursorPositionProperty',
    get: function get() {
      return this.props.direction == 'horizontal' ? 'clientX' : 'clientY';
    }
  }, {
    key: 'cssSizeProperty',
    get: function get() {
      return this.props.direction == 'horizontal' ? 'width' : 'height';
    }
  }, {
    key: 'domSizeProperty',
    get: function get() {
      return this.props.direction == 'horizontal' ? 'clientWidth' : 'clientHeight';
    }
  }, {
    key: 'dividerSize',
    get: function get() {
      return this.refs.divider[this.domSizeProperty];
    }
  }]);

  return SplitPanel;
})(_react2.default.Component);

SplitPanel.propTypes = {
  direction: _react2.default.PropTypes.oneOf(['horizontal', 'vertical']),
  minPanelSize: _react2.default.PropTypes.number
};
SplitPanel.defaultProps = {
  direction: 'horizontal',
  minPanelSize: 25
};
exports.default = SplitPanel;