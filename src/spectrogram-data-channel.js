/**
 * Provides access to the spectrogram data for a single audio channel.
 */

function SpectrogramDataChannel(spectrogramData, channelIndex, maxFreq) {
    this._spectrogramData = spectrogramData;
    this._channelIndex = channelIndex;
}

/**
 * Returns the spectrogram data as array at given position.
 */

SpectrogramDataChannel.prototype.frequency_array_at_index = function(index) {
    return this._spectrogramData._at(index, this._channelIndex);
};


/**
 * Sets the spectrogram data at index.
 * Needs whole array of spectrogram data fitting the previous data
 */

SpectrogramDataChannel.prototype.set_frequency_array_at_index = function(index, channel, sample) {
    return this._spectrogramData._set_at(index, channel, sample);
};

SpectrogramDataChannel.prototype.get_height = function(channel) {
    return this._spectrogramData._data.channels[channel].length;
};

SpectrogramDataChannel.prototype.get_length = function() {
    return this.frequency_array_at_index(0).length;
};

SpectrogramDataChannel.prototype.existsIsSpectrogram = function() {
    return true;
};

export default SpectrogramDataChannel;