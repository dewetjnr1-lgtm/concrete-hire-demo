# Concrete Hire – owner's guide (Brad)

This is a demo booking page. Customers tap a machine, fill in a short form, and it opens their email app with a ready-to-send booking request addressed to you.

Everything you change is in a file called **machines.json**. Edit it on GitHub: open the file, click the pencil icon, change it, then click **Commit changes**. The live site updates in about a minute.

## What one machine looks like

```
{
  "id": "concrete-mixer",
  "name": "Concrete Mixer",
  "description": "Electric 140L drum mixer.",
  "dailyRate": 65,
  "available": true,
  "image": "images/concrete-mixer.svg"
}
```

Careful: keep the quote marks `" "`, and keep a comma after every machine's closing `}` except the last one.

## Mark a machine hired out / available
Change `"available": true` to `"available": false` (or back). Hired Out machines still show but can't be booked.

## Change a price
Change the number after `dailyRate`. Numbers only, no `$` and no quote marks.

## Add a machine
1. Copy one whole machine block, from `{` to `}`.
2. Paste it after the last machine, and add a comma after the previous machine's `}`.
3. Change the `id` (any unique name, no spaces), name, description, rate and image.

## Use real photos instead of the drawings
1. On GitHub open the **images** folder, click **Add file → Upload files**, drag in your photo (a .jpg works well, about 800 pixels wide) and commit.
2. In machines.json change that machine's image, e.g. `"image": "images/my-mixer.jpg"`. The file name must match exactly, including capitals.

## Change the booking email address
Open **app.js**. At the very top is a clearly labelled line:

`const BOOKING_EMAIL = "ca.dewet@live.com";`

Change only the address between the quote marks.

## If something breaks
Undo your last edit: on GitHub open the file's **History** and revert it. A missing comma or quote mark is the usual cause.
