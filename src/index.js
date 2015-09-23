import cx from 'classnames';
import React from 'react';

function ucfirst(str) {
  return str.charAt(0).toUpperCase() + str.substr(1);
}

function maxmin(pos, min, max) {
  if (pos < min) { return min; }
  if (pos > max) { return max; }
  return pos;
}

const { PropTypes, Component, findDOMNode } = React;
const constants = {
  orientation: {
    horizontal: {
      dimension: 'width',
      direction: 'left',
      coordinate: 'x',
    },
    vertical: {
      dimension: 'height',
      direction: 'top',
      coordinate: 'y',
    }
  }
};

class Slider extends Component {
  static propTypes = {
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    value: PropTypes.number,
    orientation: PropTypes.string,
    onChange: PropTypes.func,
    className: PropTypes.string,
  }

  static defaultProps = {
    min: 0,
    max: 100,
    step: 1,
    value: 0,
    orientation: 'horizontal',
  }

  state = {
    limit: null,
    grab: null,
  }

  componentDidMount() {
    let { orientation } = this.props;
    let dimension = ucfirst(constants.orientation[orientation].dimension);
    const sliderPos = findDOMNode(this.refs.slider)['offset' + dimension];
    const handlePos = findDOMNode(this.refs.handle)['offset' + dimension]
    this.setState({
      limit: sliderPos - handlePos,
      grab: handlePos / 2,
    });
  }

  handleSliderMouseDown = (e) => {
    let value, { onChange } = this.props;
    if (!onChange) return;

    value = this.position(e);
    onChange && onChange(value);
  }

  handleKnobMouseDown = () => {
    document.addEventListener('mousemove', this.handleDrag);
    document.addEventListener('mouseup', this.handleDragEnd);
  }

  handleDrag = (e) => {
    let value, { onChange } = this.props;
    if (!onChange) return;

    value = this.position(e);
    onChange && onChange(value);
  }

  handleDragEnd = () => {
    document.removeEventListener('mousemove', this.handleDrag);
    document.removeEventListener('mouseup', this.handleDragEnd);
  }

  handleNoop = (e) => {
    e.stopPropagation();
    e.preventDefault();
  }

  getPositionFromValue = (value) => {
    let percentage, pos;
    let { limit } = this.state;
    let { min, max } = this.props;
    percentage = (value - min) / (max - min);
    pos = Math.round(percentage * limit);

    return pos;
  }

  getValueFromPosition = (pos) => {
    let percentage, value;
    let { limit } = this.state;
    let { orientation, min, max, step } = this.props;
    percentage = (maxmin(pos, 0, limit) / (limit || 1));

    if (orientation === 'horizontal') {
      value = step * Math.round(percentage * (max - min) / step) + min;
    } else {
      value = max - (step * Math.round(percentage * (max - min) / step) + min);
    }

    return value;
  }

  position = (e) => {
    let { orientation } = this.props;
    let pos, value, { grab } = this.state;
    const node = findDOMNode(this.refs.slider);
    const coordinateStyle = constants.orientation[orientation].coordinate;
    const directionStyle = constants.orientation[orientation].direction;
    const coordinate = e['client' + ucfirst(coordinateStyle)];
    const direction = node.getBoundingClientRect()[directionStyle];

    pos = coordinate - direction - grab;
    value = this.getValueFromPosition(pos);

    return value;
  }

  coordinates = (pos) => {
    let value, fillPos, handlePos;
    let { limit, grab } = this.state;
    let { orientation } = this.props;

    value = this.getValueFromPosition(pos);
    handlePos = this.getPositionFromValue(value);

    if (orientation === 'horizontal') {
      fillPos = handlePos + grab;
    } else {
      fillPos = limit - handlePos + grab;
    }

    return {
      fill: fillPos,
      handle: handlePos,
    };
  }

  render() {
    let dimension, direction, position, coords, fillStyle, handleStyle;
    let { value, orientation, className } = this.props;

    dimension = constants.orientation[orientation].dimension;
    direction = constants.orientation[orientation].direction;

    position = this.getPositionFromValue(value);
    coords = this.coordinates(position);

    fillStyle = {[dimension]: `${coords.fill}px`};
    handleStyle = {[direction]: `${coords.handle}px`};

    return (
      <div
        ref="slider"
        className={cx('rangeslider', 'rangeslider-' + orientation, className)}
        onMouseDown={this.handleSliderMouseDown}
        onClick={this.handleNoop}>
        <div
          ref="fill"
          className="rangeslider__fill"
          style={fillStyle} />
        <div
          ref="handle"
          onMouseDown={this.handleKnobMouseDown}
          onClick={this.handleNoop}
          className="rangeslider__handle"
          style={handleStyle} />
      </div>
    );
  }
}

export default Slider;
