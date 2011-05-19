mx_heatmap_mesures = {
  'ecpm': {
    label: 'eCPM (% of top)',
    prefix: '$',
    postfix: '',
    getScale: function(data) {
      var c = pv.Scale.quantile(data, function(d) { return d['ecpm']; }).range("#fff", "#4A85B5").quantiles(5);
      c.legendTicks = function() {
        var l = [];
        var q = c.quantiles();
        for(var i = q.length-2; i >= 0; i--) {
          var v = (q[i] + q[i+1])/2;
          l.push({
            value: v,
            min: q[i],
            max: q[i+1],
            text: '$' + v.toFixed(2) + ' (' + (5-i)*100/5 + '%)',
          });
        }
        return l;
      };
      c.between = false;
      return c;
    },
    numberFormater: function(d) { return d }
  },
  'impressions': {
    label: 'Impressions',
    prefix: '',
    postfix: '',
    getScale: function(data) {
      var f = function(d) { return d['impressions']+1; };
      var c = pv.Scale.log(data, f).range("#fff", "#B54A85");
      c.legendTicks = function() {
        var maxImp = pv.max(data, f);
        var l = [];
        var i = 1;
        do {
          l.unshift({
            value: i,
            min: i,
            max: i,
            text: i.toFixed(0),
          });
          i *= 10;
        } while(i < maxImp)
        return l;
      };
      c.between = true;
      return c;
    },
    numberFormater: pv.identity
  },
  'revenue': {
    label: 'Revenue',
    prefix: '$',
    postfix: '',
    getScale: function(data) {
      var c = pv.Scale.quantile(data, function(d) { return d['revenue']; }).range("#fff", "#854AB5").quantiles(5);
      c.legendTicks = function() {
        var l = [];
        var q = c.quantiles();
        for(var i = q.length-2; i >= 0; i--) {
          var v = (q[i] + q[i+1])/2;
          l.push({
            value: v,
            min: q[i],
            max: q[i+1],
            text: '$' + v.toFixed(2) + ' (' + (5-i)*100/5 + '%)',
          });
        }
        return l;
      };
      c.between = false;
      return c;
    },
    numberFormater: function(d) { return d.toFixed(3) }
  },
};
