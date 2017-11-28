const fastExif = require('fast-exif')

class JpegImporter {
  constructor (destinationPath) {
    this.destinationPath = destinationPath
  }
  async run (info) {
    const { date, camera } = await this.getExifInfo(info.path)
    const destinationPath = path.join(
      this.destinationPath,
      date.getFullYear().toString(),
      lpadz(date.getMonth() + 1),
      lpadz(date.getDate()),
      util.format(
        '%s-%s-%s-%s.jpg',
        lpadz(date.getHours()),
        lpadz(date.getMinutes()),
        lpadz(date.getSeconds()),
        camera,
      ),
    )
  }
  async getExifInfo (filePath) {
    const exifInfo = await fastExif.read(info.path, 16)
    return {
      date: getDate(exifInfo),
      camera: getCamera(exifInfo),
    }
  }
  getDate (exifInfo) {
    return exifInfo.exif && exifInfo.exif.DateTimeOriginal
      ? exifInfo.exifInfo.DateTimeOriginal
      : exifInfo.image.ModifyDate
  }
  getCamera (exifInfo) {
    const make = exifInfo.image.Make.split(/\s+/)
    const model = exifInfo.image.Model.split(/\s+/)
    const camera = uniq(make.concat(model))
      .join('-')
      .replace(/[^\w\d\-]+/g, '')
    return camera
  }
}
