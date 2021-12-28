/**
 * Provides access to the spectrogram data for a single audio channel.
 */

function SpectrogramDataChannel(spectrogramData, channelIndex) {
    this._spectrogramData = spectrogramData;
    this._channelIndex = channelIndex;
}

/**
 * Returns the spectrogram minimum at the given index position.
 */

SpectrogramDataChannel.prototype.min_sample = function(index) {
    var offset = (index * this._spectrogramData.channels + this._channelIndex) * 2;

    return this._spectrogramData._at(offset);
};

/**
 * Returns the spectrogram maximum at the given index position.
 */

SpectrogramDataChannel.prototype.max_sample = function(index) {
    var offset = (index * this._spectrogramData.channels + this._channelIndex) * 2 + 1;

    return this._spectrogramData._at(offset);
};

/**
 * Sets the spectrogram minimum at the given index position.
 */

SpectrogramDataChannel.prototype.set_min_sample = function(index, sample) {
    var offset = (index * this._spectrogramData.channels + this._channelIndex) * 2;

    return this._spectrogramData._set_at(offset, sample);
};

/**
 * Sets the spectrogram maximum at the given index position.
 */

SpectrogramDataChannel.prototype.set_max_sample = function(index, sample) {
    var offset = (index * this._spectrogramData.channels + this._channelIndex) * 2 + 1;

    return this._spectrogramData._set_at(offset, sample);
};

/**
 * Returns all the spectrogram minimum values as an array.
 */

SpectrogramDataChannel.prototype.min_array = function() {
    var length = this._spectrogramData.length;
    var values = [];

    for (var i = 0; i < length; i++) {
        values.push(this.min_sample(i));
    }

    return values;
};

/**
 * Returns all the spectrogram maximum values as an array.
 */

SpectrogramDataChannel.prototype.max_array = function() {
    var length = this._spectrogramData.length;
    var values = [];

    for (var i = 0; i < length; i++) {
        values.push(this.max_sample(i));
    }

    return values;
};

export default SpectrogramDataChannel;