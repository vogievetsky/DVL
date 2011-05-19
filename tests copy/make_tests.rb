units = Dir.glob("units/*")
tests = []
units.each {|u|
  if u =~ /units\/(\w+)\.js/
    name = $1
    file = File.open(u).read
    tests.push "#{file}"
  end
}
out = File.open("tests.js", "w")
out.write "var tests = [\n"
out.write tests.join(",\n")
out.write "\n];\n"
out.close