for file in *.jsx; do
  cssfile="${file%.jsx}.css"
  [ ! -f "$cssfile" ] && touch "../css/$cssfile" && echo "Created $cssfile"
done
